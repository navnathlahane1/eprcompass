"""
Retrospective AI enrichment for existing telecalling leads.
Queries leads without tc_lead_enrichments, calls Claude AI in batches,
and upserts results into tc_lead_enrichments.

Usage:
    python scripts/enrich_existing_leads_batch.py [--batch 20] [--all]

Flags:
    --batch N   leads per run (default 30, max ~50 to stay within rate limits)
    --all       enrich ALL unenriched leads (otherwise stops after first batch)
"""

import sys
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
ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"   # use Haiku for batch enrichment (cheaper/faster)

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}
NOW = datetime.now(timezone.utc).isoformat()

BATCH_SIZE = 30
ENRICH_ALL = False

for arg in sys.argv[1:]:
    if arg.startswith("--batch="):
        BATCH_SIZE = int(arg.split("=")[1])
    elif arg == "--all":
        ENRICH_ALL = True

# ── Helpers ───────────────────────────────────────────────────────────────────

def clean(v) -> str:
    s = str(v or "").strip()
    return "" if s in ("nan", "None", "NaN", "null") else s

def to_num(v):
    try:
        n = float(str(v).replace(",", ""))
        return None if n != n else n
    except Exception:
        return None

EPR_CATEGORIES = ["Plastic", "E-Waste", "Battery", "Tyre", "Used Oil"]

def build_prompt(lead: dict) -> str:
    # Parse referral_source_detail for BD enrichment fields (BD:HOT|Score:4|...)
    ref = clean(lead.get("referral_source_detail", ""))
    bd_parts = {}
    for part in ref.split("|"):
        if ":" in part:
            k, v = part.split(":", 1)
            bd_parts[k.strip()] = v.strip()

    # Parse description for state
    desc = clean(lead.get("description", ""))
    state_from_desc = ""
    m = re.match(r'^State:\s*(.+)$', desc)
    if m:
        state_from_desc = m.group(1)

    context = {
        "company_name": clean(lead.get("company_name") or lead.get("name", "")),
        "state": clean(lead.get("state") or state_from_desc),
        "city": clean(lead.get("city", "")),
        "email": clean(lead.get("email", "")),
        "phone": clean(lead.get("phone") or lead.get("mobile", "")),
        "address": clean(lead.get("address") or lead.get("description", "")),
        "source": clean(lead.get("source", "")),
        "bd_priority": bd_parts.get("BD", ""),
        "bd_priority_score": bd_parts.get("Score", ""),
        "epr_platform_fit": bd_parts.get("Fit", ""),
        "prospect_type": bd_parts.get("Type", ""),
        "category": bd_parts.get("Cat", ""),
        "tc_status": clean(lead.get("tc_status", "")),
    }

    return "\n".join([
        "You are enriching a plastic recycler/processor lead for an EPR compliance CRM in India.",
        'Return strict JSON only with these keys: ai_summary, epr_applicability_score, epr_category, lead_score, industry_inferred, size_estimate, recommended_pitch.',
        "Rules:",
        "- ai_summary: max 280 chars — who they are and EPR compliance relevance for sales team",
        "- epr_applicability_score: integer 1-10 (10 = highest EPR compliance obligation)",
        '- epr_category: single string from ["Plastic","E-Waste","Battery","Tyre","Used Oil","Multiple"]',
        "- lead_score: integer 1-100 (overall telecalling priority score)",
        "- industry_inferred: short string, e.g. 'Plastic Recycler', 'Cement Co-Processor', 'Waste-to-Energy'",
        "- size_estimate: one of 'Small', 'Medium', 'Large', 'Enterprise'",
        "- recommended_pitch: max 150 chars — best opening angle for this company",
        f"Input: {json.dumps(context)}",
    ])

# ── Fetch unenriched leads ────────────────────────────────────────────────────

def fetch_all_pages(url: str, params: dict, page_size: int = 1000) -> list:
    """Paginate through all results from a Supabase endpoint."""
    results = []
    offset = 0
    while True:
        r = requests.get(
            url,
            headers={**HEADERS, "Range": f"{offset}-{offset + page_size - 1}",
                     "Prefer": "count=none"},
            params=params,
        )
        if not r.ok:
            break
        data = r.json()
        if not isinstance(data, list):
            break
        results.extend(data)
        if len(data) < page_size:
            break
        offset += page_size
    return results


def get_unenriched_leads(limit: int) -> list:
    """Get leads that have no entry in tc_lead_enrichments."""
    enriched_data = fetch_all_pages(
        f"{SUPABASE_URL}/rest/v1/tc_lead_enrichments",
        {"select": "lead_id"},
    )
    enriched_ids = set(row["lead_id"] for row in enriched_data if isinstance(row, dict))

    all_leads = fetch_all_pages(
        f"{SUPABASE_URL}/rest/v1/leads",
        {
            "select": "id,company_name,name,email,phone,mobile,city,"
                      "description,source,referral_source_detail,tc_status",
            "order": "created_at.asc",
        },
        page_size=500,
    )
    unenriched = [l for l in all_leads if isinstance(l, dict) and l.get("id") not in enriched_ids]
    return unenriched[:limit]

# ── Call Claude AI ────────────────────────────────────────────────────────────

def enrich_lead(lead: dict) -> dict | None:
    prompt = build_prompt(lead)
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
                "max_tokens": 400,
                "temperature": 0.1,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=20,
        )
        if not resp.ok:
            return None
        data = resp.json()
        text = "".join(c["text"] for c in data.get("content", []) if c.get("type") == "text").strip()
        # Extract JSON
        candidate = text if text.startswith("{") else (re.search(r'\{[\s\S]*\}', text) or type('x',(),{"group":lambda s,*a:"{}"})()).group(0)
        parsed = json.loads(candidate)
        return parsed
    except Exception as e:
        print(f"    AI error for {lead.get('id')}: {e}")
        return None

# ── Upsert enrichment ─────────────────────────────────────────────────────────

def upsert_enrichment(lead_id: str, data: dict):
    payload = {
        "lead_id": lead_id,
        "ai_summary": clean(data.get("ai_summary", ""))[:280] or None,
        "epr_applicability_score": to_num(data.get("epr_applicability_score")),
        "epr_category": clean(data.get("epr_category", "")) or None,
        "lead_score": to_num(data.get("lead_score")),
        "industry_inferred": clean(data.get("industry_inferred", "")) or None,
        "size_estimate": clean(data.get("size_estimate", "")) or None,
        "recommended_pitch": clean(data.get("recommended_pitch", ""))[:150] or None,
        "enrichment_source": "anthropic",
        "model_used": ANTHROPIC_MODEL,
        "raw_response": json.dumps(data),
        "updated_at": NOW,
    }
    # Try insert first
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/tc_lead_enrichments",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json=payload,
    )
    if not r.ok:
        # Patch existing row
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/tc_lead_enrichments?lead_id=eq.{lead_id}",
            headers={**HEADERS, "Prefer": "return=minimal"},
            json={k: v for k, v in payload.items() if k != "lead_id"},
        )

# ── Also update lead's tc_enrichment_status ──────────────────────────────────

def mark_lead_enriched(lead_id: str, score):
    status = "enriched" if score else "failed"
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/leads?id=eq.{lead_id}",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json={"tc_enrichment_status": status},
    )

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("\n=== Retrospective Lead Enrichment (Claude AI) ===\n")
    print(f"  Batch size  : {BATCH_SIZE}")
    print(f"  Enrich all  : {ENRICH_ALL}")
    print(f"  Model       : {ANTHROPIC_MODEL}\n")

    total_done = 0
    total_failed = 0
    offset_batch = 0

    while True:
        limit = BATCH_SIZE if not ENRICH_ALL else 500
        print(f"Fetching unenriched leads (limit={limit}, pass={offset_batch+1})...")
        leads = get_unenriched_leads(limit)

        if not leads:
            print("  No more unenriched leads.")
            break

        print(f"  Found {len(leads)} leads to enrich\n")

        for i, lead in enumerate(leads, 1):
            lead_id = lead.get("id")
            name    = clean(lead.get("company_name") or lead.get("name", "Unknown"))
            print(f"  [{i}/{len(leads)}] {name[:50]}...", end=" ", flush=True)

            result = enrich_lead(lead)
            if result:
                upsert_enrichment(lead_id, result)
                mark_lead_enriched(lead_id, result.get("epr_applicability_score"))
                score = result.get("epr_applicability_score", "?")
                cat   = result.get("epr_category", "?")
                print("OK EPR=" + str(score) + "/10 cat=" + str(cat))
                total_done += 1
            else:
                mark_lead_enriched(lead_id, None)
                print("FAIL")
                total_failed += 1

            time.sleep(0.4)   # ~2.5 rps — well within Haiku rate limits

        offset_batch += 1
        if not ENRICH_ALL:
            break

    print(f"""
=== Enrichment Complete ===
  Successfully enriched : {total_done}
  Failed                : {total_failed}
""")

if __name__ == "__main__":
    main()
