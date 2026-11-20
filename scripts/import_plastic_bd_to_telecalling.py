"""
Import Plastic_Processors_BD_Enriched.xlsx into telecalling leads table.
Deduplicates against existing leads, inserts new ones, then assigns
alternately across two configured agents.

Usage:
    python scripts/import_plastic_bd_to_telecalling.py
"""

import sys
import os
import pandas as pd
import requests
import re
import time
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
EXCEL_PATH = os.environ["PLASTIC_BD_EXCEL_PATH"]

AGENT_A_ID = os.environ["TELECALLER_AGENT_A_ID"]
AGENT_B_ID = os.environ["TELECALLER_AGENT_B_ID"]
AGENTS = [AGENT_A_ID, AGENT_B_ID]
CHUNK_SIZE = 200

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": "Bearer " + SERVICE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}
NOW = datetime.now(timezone.utc).isoformat()


def clean(v):
    s = str(v or "").strip()
    return "" if s in ("nan", "None", "NaN") else s


def norm_phone(p):
    return re.sub(r'\D', '', p)[-10:]


def norm_company(name):
    s = str(name or "").lower()
    s = re.sub(r'\s+(pvt|private|ltd|limited|llp|inc|corp)\.?\s*$', '', s)
    return re.sub(r'[^\w\s]', '', s).strip()


def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def load_existing_leads():
    phones = set()
    emails = set()
    companies = set()
    page = 0
    while True:
        r = requests.get(
            SUPABASE_URL + "/rest/v1/leads",
            headers={**HEADERS, "Range": str(page * 1000) + "-" + str(page * 1000 + 999)},
            params={"select": "phone,mobile,email,company_name,name"},
        )
        rows = r.json()
        if not rows:
            break
        for row in rows:
            if row.get("phone"):       phones.add(norm_phone(row["phone"]))
            if row.get("mobile"):      phones.add(norm_phone(row["mobile"]))
            if row.get("email"):       emails.add(row["email"].lower().strip())
            n = row.get("company_name") or row.get("name") or ""
            if n: companies.add(norm_company(n))
        if len(rows) < 1000:
            break
        page += 1
    print("  Existing: " + str(len(phones)) + " phones, " + str(len(emails)) + " emails, " + str(len(companies)) + " companies")
    return phones, emails, companies


def load_excel():
    df = pd.read_excel(EXCEL_PATH, sheet_name="Master BD List", dtype=str).fillna("")
    print("  Raw rows: " + str(len(df)))
    return df


RATING_MAP = {"HOT": "Hot", "WARM": "Warm", "COLD": "Cold"}


def clean_phone(raw: str) -> str | None:
    """Take first non-empty line, keep only digits/spaces/+, truncate to 20 chars."""
    if not raw:
        return None
    first = raw.split("\n")[0].strip()
    cleaned = re.sub(r'[^\d\s+\-()]', '', first).strip()
    return cleaned[:20] or None


def build_lead(row):
    name          = clean(row.get("Name"))
    email         = clean(row.get("Email (Clean)")).lower()
    phone_raw     = clean(row.get("Contact no"))
    state         = clean(row.get("State"))
    city          = clean(row.get("Region"))
    address       = clean(row.get("Address"))
    bd_priority   = clean(row.get("BD Priority"))
    bd_score_raw  = clean(row.get("BD Priority Score"))
    bd_action     = clean(row.get("BD Action"))
    epr_fit       = clean(row.get("EPR Platform Fit"))
    prospect      = clean(row.get("Prospect Type"))
    category      = clean(row.get("Category"))
    processing    = clean(row.get("Processing Capabilities"))
    scale         = clean(row.get("Scale of Operation"))
    no_waste_cats = clean(row.get("No. of Waste Categories"))
    cat_iv        = clean(row.get("CAT IV (Large Scale)"))
    email_domain  = clean(row.get("Email Domain Type"))

    try:
        bd_score = int(float(bd_score_raw)) if bd_score_raw else None
    except (ValueError, TypeError):
        bd_score = None

    desc_parts = []
    if state:         desc_parts.append("State: " + state)
    if address:       desc_parts.append("Addr: " + address[:200])
    if epr_fit:       desc_parts.append("EPR Fit: " + epr_fit)
    if bd_action:     desc_parts.append("BD Action: " + bd_action)
    if no_waste_cats: desc_parts.append("Waste Cat Count: " + no_waste_cats)
    if cat_iv:        desc_parts.append("CAT IV: " + cat_iv)
    description = "\n".join(desc_parts) or None

    waste_cats = [c.strip() for c in category.split(",") if c.strip()] if category else []
    tags = [t for t in [bd_priority, epr_fit] if t]

    return {
        "company_name": name,
        "name": name,
        "email": email or None,
        "phone": clean_phone(phone_raw),
        "city": city or None,
        "website": email_domain or None,
        "lead_score": bd_score,
        "description": description,
        "stage": "New",
        "source": "TC Import",
        "referral_source_detail": "TC Import",
        "tc_status": "New",
        "rating": RATING_MAP.get(bd_priority) if bd_priority else None,
        "industry": prospect or None,
        "pain_point": processing or None,
        "competitor_using": scale or None,
        "waste_categories": waste_cats or None,
        "tags": tags or None,
    }


def insert_batch(rows):
    r = requests.post(SUPABASE_URL + "/rest/v1/leads", headers=HEADERS, json=rows)
    if not r.ok:
        print("    Insert error: " + str(r.status_code) + " " + r.text[:200])
        return []
    data = r.json()
    return [row.get("id") for row in data if row.get("id")]


def assign_leads(lead_ids):
    agent_a_ids   = [lead_ids[i] for i in range(0, len(lead_ids), 2)]
    agent_b_ids = [lead_ids[i] for i in range(1, len(lead_ids), 2)]
    for agent_id, ids in [(AGENT_A_ID, agent_a_ids), (AGENT_B_ID, agent_b_ids)]:
        for batch in chunks(ids, 200):
            id_list = ",".join(batch)
            requests.patch(
                SUPABASE_URL + "/rest/v1/leads?id=in.(" + id_list + ")",
                headers={**HEADERS, "Prefer": "return=minimal"},
                json={"tc_assigned_agent": agent_id},
            )
            time.sleep(0.1)


def main():
    print("\n=== Telecalling Import: Plastic BD Enriched Data ===\n")

    print("1. Loading existing leads for dedup...")
    ex_phones, ex_emails, ex_companies = load_existing_leads()

    print("\n2. Loading Excel...")
    df = load_excel()

    print("\n3. Filtering & deduplicating...")
    valid_rows = []
    dup_count = 0
    error_count = 0
    seen_phones = set(ex_phones)
    seen_emails = set(ex_emails)
    seen_companies = set(ex_companies)

    for _, row in df.iterrows():
        name      = clean(row.get("Name"))
        email_raw = clean(row.get("Email (Clean)")).lower()
        phone_raw = clean(row.get("Contact no"))

        if not name and not phone_raw and not email_raw:
            error_count += 1
            continue

        norm_ph = norm_phone(phone_raw) if phone_raw else ""
        norm_co = norm_company(name) if name else ""
        norm_em = email_raw

        is_dup = (
            (norm_ph and norm_ph in seen_phones) or
            (norm_em and norm_em in seen_emails) or
            (norm_co and norm_co in seen_companies)
        )
        if is_dup:
            dup_count += 1
            continue

        if norm_ph: seen_phones.add(norm_ph)
        if norm_em: seen_emails.add(norm_em)
        if norm_co: seen_companies.add(norm_co)
        valid_rows.append(build_lead(row))

    print("  Valid (new): " + str(len(valid_rows)) + "  Duplicates: " + str(dup_count) + "  Errors: " + str(error_count))

    print("\n4. Inserting " + str(len(valid_rows)) + " leads in batches of " + str(CHUNK_SIZE) + "...")
    all_ids = []
    for batch in chunks(valid_rows, CHUNK_SIZE):
        ids = insert_batch(batch)
        all_ids.extend(ids)
        print("   Batch inserted: " + str(len(ids)) + " rows (total: " + str(len(all_ids)) + ")")
        time.sleep(0.2)

    print("\n5. Assigning " + str(len(all_ids)) + " leads to Agent A & Agent B...")
    if all_ids:
        assign_leads(all_ids)
        agent_a_count   = (len(all_ids) + 1) // 2
        agent_b_count = len(all_ids) // 2
        print(f"   {os.environ.get('TELECALLER_AGENT_A_LABEL', 'Agent A')}: {agent_a_count} leads")
        print(f"   {os.environ.get('TELECALLER_AGENT_B_LABEL', 'Agent B')}: {agent_b_count} leads")

    print("\n=== Done ===")
    print("  New leads imported  : " + str(len(all_ids)))
    print("  Duplicates skipped  : " + str(dup_count))
    print("  Errors (empty rows) : " + str(error_count))


if __name__ == "__main__":
    main()
