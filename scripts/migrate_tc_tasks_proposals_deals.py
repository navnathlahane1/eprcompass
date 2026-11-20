"""
Create tc_tasks, tc_proposals, tc_deals tables via Supabase RPC.
Run once: python scripts/migrate_tc_tasks_proposals_deals.py
"""
import requests, json
import os

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": "Bearer " + SERVICE_KEY,
    "Content-Type": "application/json",
}

SQL = """
-- ── tc_tasks ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tc_tasks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  lead_id       UUID        REFERENCES leads(id) ON DELETE SET NULL,
  created_by    UUID        NOT NULL REFERENCES profiles(id),
  assigned_to   UUID        REFERENCES profiles(id),
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','in_progress','completed','escalated','cancelled')),
  priority      TEXT        NOT NULL DEFAULT 'normal'
                            CHECK (priority IN ('low','normal','high','urgent')),
  due_date      TIMESTAMPTZ,
  allocated_at  TIMESTAMPTZ,
  escalated_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tc_tasks_created_by_idx   ON tc_tasks(created_by);
CREATE INDEX IF NOT EXISTS tc_tasks_assigned_to_idx  ON tc_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tc_tasks_status_idx       ON tc_tasks(status);
CREATE INDEX IF NOT EXISTS tc_tasks_lead_id_idx      ON tc_tasks(lead_id);

-- ── tc_proposals ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tc_proposals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  content_html  TEXT,
  amount_inr    NUMERIC(14,2),
  valid_until   DATE,
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','sent','viewed','accepted','rejected')),
  created_by    UUID        NOT NULL REFERENCES profiles(id),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tc_proposals_lead_id_idx    ON tc_proposals(lead_id);
CREATE INDEX IF NOT EXISTS tc_proposals_created_by_idx ON tc_proposals(created_by);
CREATE INDEX IF NOT EXISTS tc_proposals_status_idx     ON tc_proposals(status);

-- ── tc_deals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tc_deals (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              UUID        REFERENCES leads(id) ON DELETE SET NULL,
  title                TEXT        NOT NULL,
  stage                TEXT        NOT NULL DEFAULT 'Qualification'
                                   CHECK (stage IN ('Qualification','Proposal Sent','Negotiation','Closed Won','Closed Lost')),
  amount_inr           NUMERIC(14,2),
  expected_close_date  DATE,
  probability          INT         CHECK (probability BETWEEN 0 AND 100),
  notes                TEXT,
  assigned_to          UUID        REFERENCES profiles(id),
  created_by           UUID        NOT NULL REFERENCES profiles(id),
  closed_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tc_deals_lead_id_idx    ON tc_deals(lead_id);
CREATE INDEX IF NOT EXISTS tc_deals_created_by_idx ON tc_deals(created_by);
CREATE INDEX IF NOT EXISTS tc_deals_stage_idx      ON tc_deals(stage);
"""

def run():
    r = requests.post(
        SUPABASE_URL + "/rest/v1/rpc/exec_sql",
        headers=HEADERS,
        json={"sql": SQL},
    )
    if r.ok:
        print("Migration succeeded via exec_sql RPC")
        return

    # Fallback: try pg_query if available
    r2 = requests.post(
        SUPABASE_URL + "/rest/v1/rpc/pg_query",
        headers=HEADERS,
        json={"query": SQL},
    )
    if r2.ok:
        print("Migration succeeded via pg_query RPC")
        return

    print("RPC not available — applying via individual table creates...")
    # Supabase Management API fallback
    mgmt_url = "https://api.supabase.com/v1/projects/asisbvayufebiywcwrjn/database/query"
    r3 = requests.post(mgmt_url, headers={**HEADERS, "Authorization": "Bearer " + SERVICE_KEY}, json={"query": SQL})
    print("Mgmt API:", r3.status_code, r3.text[:200])

if __name__ == "__main__":
    run()
