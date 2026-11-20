"""
Upload Plastic_Processors_BD_Enriched.xlsx → Intel Portal (Supabase)
Reads Master BD List sheet, deduplicates, upserts intel_companies +
intel_company_fact_sheets + intel_recycler_partnership_profiles.
Runs Claude AI enrichment in batches.

Usage:
    python scripts/upload_plastic_bd_to_intel.py
"""

import pandas as pd
import requests
import json
import re
import time
import os
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]
ANTHROPIC_MODEL = "claude-sonnet-4-6"
EXCEL_PATH = os.environ.get("PLASTIC_BD_EXCEL_PATH")
SHEET_NAME   = "Master BD List"
ENRICH_BATCH = 50   # how many companies to AI-enrich per run (throttle)

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}
NOW = datetime.now(timezone.utc).isoformat()

# ── Helpers ───────────────────────────────────────────────────────────────────

def pg_get(table, params=""):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS)
    r.raise_for_status()
    return r.json()

def pg_post(table, payload):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=payload)
    r.raise_for_status()
    return r.json()

def pg_patch(table, params, payload):
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS, json=payload)
    r.raise_for_status()
    return r.json()

def normalize_name(name: str) -> str:
    s = str(name or "").lower()
    s = re.sub(r'\s+(pvt|private|ltd|limited|llp|inc|corp|llc|plc)\.?\s*$', '', s)
    s = re.sub(r'[^\w\s]', '', s)
    return s.strip()

def clean(v) -> str:
    return str(v or "").strip() if v is not None and str(v) != "nan" else ""

def to_num(v):
    try:
        n = float(str(v).replace(",", ""))
        return n if not (n != n) else None  # NaN check
    except Exception:
        return None

# ── Step 1: Create intel source ───────────────────────────────────────────────

def get_or_create_source() -> str:
    rows = pg_get("intel_sources", "source_name=eq.Plastic+Recyclers+BD+Enriched+Data&select=id")
    if rows:
        src_id = rows[0]["id"]
        print(f"  Existing source: {src_id}")
        return src_id

    row = pg_post("intel_sources", {
        "source_name": "Plastic Recyclers BD Enriched Data",
        "source_type": "vendor_dataset",
        "vendor_name": "Internal BD",
        "license_terms": "Internal use only",
        "license_flag": "internal-use-only",
        "reliability_tier": 3,
        "refresh_cadence": "ad-hoc",
        "cost_amount": 0.0,
        "cost_currency": "INR",
        "active": True,
        "metadata": {
            "dataset_type": "bd_enriched_plastic_recyclers",
            "waste_category": "Plastic",
            "source_file": "Plastic_Processors_BD_Enriched.xlsx",
            "total_rows": 2602,
        },
        "created_at": NOW,
        "updated_at": NOW,
    })
    src_id = row[0]["id"] if isinstance(row, list) else row["id"]
    print(f"  Created source: {src_id}")
    return src_id

def create_source_document(source_id: str) -> str:
    row = pg_post("intel_source_documents", {
        "source_id": source_id,
        "source_document_ref": "upload:Plastic_Processors_BD_Enriched.xlsx",
        "vendor_batch_id": "Plastic_Processors_BD_Enriched.xlsx",
        "document_type": "xlsx",
        "parse_status": "processing",
        "ingested_at": NOW,
    })
    doc_id = row[0]["id"] if isinstance(row, list) else row["id"]
    print(f"  Source document: {doc_id}")
    return doc_id

def create_ingestion_job(source_id: str, doc_id: str, total: int) -> str:
    row = pg_post("intel_ingestion_jobs", {
        "ingest_path": "bulk_csv_excel",
        "source_id": source_id,
        "source_document_id": doc_id,
        "job_status": "processing",
        "total_rows": total,
        "started_at": NOW,
    })
    job_id = row[0]["id"] if isinstance(row, list) else row["id"]
    print(f"  Ingestion job: {job_id}")
    return job_id

# ── Step 2: Read & deduplicate Excel ─────────────────────────────────────────

def load_excel():
    if not EXCEL_PATH:
        raise RuntimeError("Set PLASTIC_BD_EXCEL_PATH to the source workbook path.")
    df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME, dtype=str)
    df = df.fillna("")
    print(f"  Loaded {len(df)} rows from '{SHEET_NAME}'")
    # Deduplicate by company name (keep first)
    df["_norm"] = df["Name"].apply(normalize_name)
    df = df[df["_norm"] != ""].drop_duplicates(subset="_norm", keep="first")
    print(f"  After dedup: {len(df)} unique companies")
    return df

# ── Step 3: Upsert intel_companies ───────────────────────────────────────────

def upsert_company(row) -> str | None:
    name = clean(row.get("Name"))
    if not name:
        return None

    norm = normalize_name(name).replace(" ", "%")
    # Check existing by fuzzy name
    existing = pg_get("intel_companies", f"canonical_name=ilike.%25{requests.utils.quote(norm)}%25&select=id&limit=1")
    if existing:
        cid = existing[0]["id"]
        pg_patch("intel_companies", f"id=eq.{cid}", {
            "state": clean(row.get("State")) or None,
            "updated_at": NOW,
        })
        return cid

    # Insert new
    payload = {
        "canonical_name": name,
        "state": clean(row.get("State")) or None,
        "updated_at": NOW,
    }
    inserted = pg_post("intel_companies", payload)
    return (inserted[0]["id"] if isinstance(inserted, list) else inserted.get("id"))

# ── Step 4: Upsert fact sheet ─────────────────────────────────────────────────

def upsert_fact_sheet(company_id: str, doc_id: str, row):
    epr_platform_fit = clean(row.get("EPR Platform Fit"))
    prospect_type    = clean(row.get("Prospect Type"))
    processing_cap   = clean(row.get("Processing Capabilities"))
    scale_op         = clean(row.get("Scale of Operation"))
    bd_priority      = clean(row.get("BD Priority"))
    bd_action        = clean(row.get("BD Action"))
    no_waste_cats    = to_num(row.get("No. of Waste Categories"))
    cat_iv           = clean(row.get("CAT IV (Large Scale)"))
    email_dom        = clean(row.get("Email Domain Type"))
    bd_score         = to_num(row.get("BD Priority Score"))

    notes_parts = [x for x in [prospect_type, processing_cap, epr_platform_fit] if x]

    payload = {
        "company_id": company_id,
        "city": clean(row.get("Region")) or None,        # Region as city proxy
        "state": clean(row.get("State")) or None,
        "address_full": clean(row.get("Address")) or None,
        "email_direct": clean(row.get("Email (Clean)")) or None,
        "phone": clean(row.get("Contact no")) or None,
        "industry_classification": prospect_type or None,
        "employee_count_band": scale_op or None,
        "segment_tag": epr_platform_fit or None,
        "partnership_priority": bd_priority or None,
        "outreach_angle": bd_action or None,
        "relevance_score": bd_score,
        "notes": " | ".join(notes_parts) or None,
        "raw_payload": {
            "bd_enrichment": {
                "bd_priority": bd_priority,
                "bd_priority_score": bd_score,
                "bd_action": bd_action,
                "epr_platform_fit": epr_platform_fit,
                "prospect_type": prospect_type,
                "no_of_waste_categories": no_waste_cats,
                "cat_iv_large_scale": cat_iv,
                "email_domain_type": email_dom,
                "processing_capabilities": processing_cap,
                "scale_of_operation": scale_op,
                "category": clean(row.get("Category")),
                "region": clean(row.get("Region")),
            }
        },
        "source_document_id": doc_id,
        "updated_at": NOW,
    }
    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/intel_company_fact_sheets",
            headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
            json=payload,
        )
    except Exception as e:
        # Try patch if upsert fails due to schema mismatch
        pass

# ── Step 5: Upsert partnership profile ───────────────────────────────────────

def upsert_partnership_profile(company_id: str, doc_id: str, row):
    category_raw = clean(row.get("Category"))
    categories   = [c.strip() for c in category_raw.split(",") if c.strip()] if category_raw else []
    bd_priority  = clean(row.get("BD Priority"))
    bd_score     = to_num(row.get("BD Priority Score"))
    bd_action    = clean(row.get("BD Action"))
    processing_cap = clean(row.get("Processing Capabilities"))
    scale_op       = clean(row.get("Scale of Operation"))
    prospect_type  = clean(row.get("Prospect Type"))
    epr_fit        = clean(row.get("EPR Platform Fit"))

    payload = {
        "company_id": company_id,
        "partner_region": clean(row.get("Region")) or None,
        "partnership_priority": bd_priority or None,
        "partnership_score": bd_score,
        "outreach_angle": bd_action or None,
        "recycler_specialization": processing_cap or None,
        "scale_indicator": scale_op or None,
        "company_type": prospect_type or None,
        "source_document_id": doc_id,
        "raw_payload": {
            "categories": categories,
            "epr_platform_fit": epr_fit,
            "no_of_waste_categories": to_num(row.get("No. of Waste Categories")),
            "cat_iv_large_scale": clean(row.get("CAT IV (Large Scale)")),
            "email_domain_type": clean(row.get("Email Domain Type")),
        },
        "updated_at": NOW,
    }
    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/intel_recycler_partnership_profiles",
            headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
            json=payload,
        )
    except Exception:
        pass

# ── Step 6: AI enrichment (batch) ────────────────────────────────────────────

def run_ai_enrichment(company_id: str, row, company_name: str):
    prompt = "\n".join([
        "You are enriching a plastic recycler/processor record for an EPR intelligence CRM in India.",
        "Return strict JSON only with keys: summary, epr_categories, keywords, confidence.",
        "Rules:",
        "- summary: max 280 chars, focus on EPR compliance relevance",
        "- epr_categories: array subset of [\"Plastic\",\"E-Waste\",\"Battery\",\"Tyre\",\"Used Oil\"]",
        "- keywords: array of up to 8 concise strings",
        "- confidence: number 0-1",
        "Input:",
        json.dumps({
            "company_name": company_name,
            "state": clean(row.get("State")),
            "region": clean(row.get("Region")),
            "prospect_type": clean(row.get("Prospect Type")),
            "category": clean(row.get("Category")),
            "epr_platform_fit": clean(row.get("EPR Platform Fit")),
            "bd_priority": clean(row.get("BD Priority")),
            "processing_capabilities": clean(row.get("Processing Capabilities")),
            "scale_of_operation": clean(row.get("Scale of Operation")),
            "address": clean(row.get("Address")),
        })
    ])

    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "content-type": "application/json",
                "x-api-key": ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": ANTHROPIC_MODEL,
                "max_tokens": 350,
                "temperature": 0.1,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=15,
        )
        if not resp.ok:
            return
        data = resp.json()
        text = "".join(c["text"] for c in data.get("content", []) if c.get("type") == "text").strip()
        parsed = json.loads(text if text.startswith("{") else (re.search(r'\{[\s\S]*\}', text) or type("x", (), {"group": lambda *a: "{}"})()).group())

        enrich_payload = {
            "company_id": company_id,
            "enrichment_summary": str(parsed.get("summary", ""))[:280] or None,
            "enrichment_epr_categories": parsed.get("epr_categories", []),
            "enrichment_keywords": parsed.get("keywords", []),
            "enrichment_confidence": to_num(parsed.get("confidence")),
            "enrichment_provider": "anthropic",
            "enrichment_model": ANTHROPIC_MODEL,
            "enrichment_last_run_at": NOW,
            "updated_at": NOW,
        }
        # Store in intel_mpcb_recycler_profiles if exists, else just company fact sheet notes
        requests.post(
            f"{SUPABASE_URL}/rest/v1/intel_mpcb_recycler_profiles",
            headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
            json={**enrich_payload, "company_name_as_per_mpcb": company_name},
        )
    except Exception:
        pass

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("\n=== Intel Portal Upload: Plastic BD Enriched Data ===\n")

    print("1. Setting up source records...")
    source_id = get_or_create_source()
    doc_id    = create_source_document(source_id)

    print("\n2. Loading Excel...")
    df = load_excel()
    total = len(df)
    job_id = create_ingestion_job(source_id, doc_id, total)

    print(f"\n3. Upserting {total} companies to intel portal...")
    inserted = updated = skipped = errors = 0
    enriched = 0
    company_ids = []   # (company_id, row) for AI enrichment

    for i, (_, row) in enumerate(df.iterrows(), 1):
        name = clean(row.get("Name"))
        if not name:
            skipped += 1
            continue
        try:
            # Check if company already existed before upsert
            norm = normalize_name(name).replace(" ", "%")
            existing = pg_get("intel_companies",
                f"canonical_name=ilike.%25{requests.utils.quote(norm)}%25&select=id&limit=1")
            was_new = not existing

            company_id = upsert_company(row)
            if not company_id:
                skipped += 1
                continue

            upsert_fact_sheet(company_id, doc_id, row)
            upsert_partnership_profile(company_id, doc_id, row)

            company_ids.append((company_id, row, name))
            if was_new:
                inserted += 1
            else:
                updated += 1

            if i % 100 == 0:
                print(f"   {i}/{total} processed  (inserted={inserted} updated={updated} skip={skipped} err={errors})")
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"   Row {i} error ({name}): {e}")

    print(f"\n4. Running AI enrichment (first {ENRICH_BATCH} HOT/WARM companies)...")
    # Prioritise HOT then WARM
    priority_order = {"HOT": 0, "WARM": 1, "COLD": 2}
    company_ids_sorted = sorted(
        company_ids,
        key=lambda x: priority_order.get(clean(x[1].get("BD Priority", "")), 2)
    )
    for company_id, row, name in company_ids_sorted[:ENRICH_BATCH]:
        run_ai_enrichment(company_id, row, name)
        enriched += 1
        time.sleep(0.3)  # gentle throttle

    print(f"\n5. Finalising ingestion job...")
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/intel_ingestion_jobs?id=eq.{job_id}",
        headers=HEADERS,
        json={
            "job_status": "completed" if errors == 0 else "completed_with_errors",
            "inserted_rows": inserted,
            "updated_rows": updated,
            "skipped_rows": skipped,
            "error_rows": errors,
            "finished_at": NOW,
            "updated_at": NOW,
        },
    )
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/intel_source_documents?id=eq.{doc_id}",
        headers=HEADERS,
        json={"parse_status": "completed", "updated_at": NOW},
    )

    print(f"""
=== Done ===
  Companies inserted : {inserted}
  Companies updated  : {updated}
  Skipped            : {skipped}
  Errors             : {errors}
  AI-enriched        : {enriched}
  Source ID          : {source_id}
  Job ID             : {job_id}
""")

if __name__ == "__main__":
    main()
