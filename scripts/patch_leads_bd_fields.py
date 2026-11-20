"""
Backfill missing BD fields on leads imported from Plastic_Processors_BD_Enriched.xlsx.

Adds:
  website          <- Email Domain Type
  lead_score       <- BD Priority Score (0-4)
  description      <- adds BD Action, Waste Cat Count, CAT IV (if not already present)

Matches leads by exact company_name (as stored from import).
Only patches leads with source='TC Import'.

Usage:
    python scripts/patch_leads_bd_fields.py
"""

import pandas as pd
import requests
import re
import time
import os

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
EXCEL_PATH = os.environ["PLASTIC_BD_EXCEL_PATH"]

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": "Bearer " + SERVICE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def clean(v):
    s = str(v or "").strip()
    return "" if s in ("nan", "None", "NaN") else s


def fetch_all_tc_leads():
    """Fetch all TC Import leads (id + company_name)."""
    results = []
    offset = 0
    while True:
        r = requests.get(
            SUPABASE_URL + "/rest/v1/leads",
            headers={**HEADERS, "Range": str(offset) + "-" + str(offset + 499),
                     "Prefer": "count=none"},
            params={
                "select": "id,company_name,name,description,website,lead_score",
                "source": "eq.TC Import",
                "order": "created_at.asc",
            },
        )
        if not r.ok:
            print("Fetch error: " + str(r.status_code) + " " + r.text[:100])
            break
        data = r.json()
        if not isinstance(data, list):
            break
        results.extend(data)
        if len(data) < 500:
            break
        offset += 500
    return results


def main():
    print("\n=== Patch BD Fields on TC Import Leads ===\n")

    print("1. Loading Excel...")
    df = pd.read_excel(EXCEL_PATH, sheet_name="Master BD List", dtype=str).fillna("")
    print("   Rows: " + str(len(df)))

    # Build lookup: exact company name -> BD fields
    excel_map = {}
    for _, row in df.iterrows():
        name = clean(row.get("Name"))
        if not name:
            continue
        bd_score_raw  = clean(row.get("BD Priority Score"))
        bd_action     = clean(row.get("BD Action"))
        epr_fit       = clean(row.get("EPR Platform Fit"))
        no_waste_cats = clean(row.get("No. of Waste Categories"))
        cat_iv        = clean(row.get("CAT IV (Large Scale)"))
        email_domain  = clean(row.get("Email Domain Type"))
        state         = clean(row.get("State"))
        address       = clean(row.get("Address"))

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

        excel_map[name] = {
            "website": email_domain or None,
            "lead_score": bd_score,
            "description": "\n".join(desc_parts) or None,
        }

    print("   Excel entries indexed: " + str(len(excel_map)))

    print("\n2. Fetching TC Import leads from DB...")
    leads = fetch_all_tc_leads()
    print("   Found: " + str(len(leads)) + " TC Import leads")

    print("\n3. Patching leads with missing BD fields...")
    patched = 0
    skipped = 0
    not_found = 0

    for lead in leads:
        lead_id = lead.get("id")
        company = lead.get("company_name") or lead.get("name") or ""

        if company not in excel_map:
            not_found += 1
            continue

        bd = excel_map[company]

        patch = {}
        if bd["website"] and not lead.get("website"):
            patch["website"] = bd["website"]
        if bd["lead_score"] is not None and (lead.get("lead_score") is None or lead.get("lead_score") == 0):
            patch["lead_score"] = bd["lead_score"]
        # Always overwrite description for TC Import leads (fresh import, no manual notes)
        if bd["description"]:
            patch["description"] = bd["description"]

        if not patch:
            skipped += 1
            continue

        r = requests.patch(
            SUPABASE_URL + "/rest/v1/leads?id=eq." + lead_id,
            headers=HEADERS,
            json=patch,
        )
        if r.ok:
            patched += 1
        else:
            print("   PATCH error for " + company[:40] + ": " + r.text[:80])

        if patched % 200 == 0 and patched > 0:
            print("   Patched " + str(patched) + " so far...")
        time.sleep(0.05)

    print("\n=== Done ===")
    print("  Patched     : " + str(patched))
    print("  Already OK  : " + str(skipped))
    print("  Not in Excel: " + str(not_found))


if __name__ == "__main__":
    main()
