-- Run this in: Supabase Dashboard → SQL Editor
-- Creates tc_tasks, tc_proposals, tc_deals tables

-- ── tc_tasks ──────────────────────────────────────────────────────────────────
-- Tasks created by telecallers, auto-assigned to admin for oversight.
CREATE TABLE IF NOT EXISTS public.tc_tasks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  lead_id       UUID        REFERENCES public.leads(id) ON DELETE SET NULL,
  created_by    UUID        NOT NULL REFERENCES public.profiles(id),
  assigned_to   UUID        REFERENCES public.profiles(id),
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

CREATE INDEX IF NOT EXISTS tc_tasks_created_by_idx  ON public.tc_tasks(created_by);
CREATE INDEX IF NOT EXISTS tc_tasks_assigned_to_idx ON public.tc_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tc_tasks_status_idx      ON public.tc_tasks(status);
CREATE INDEX IF NOT EXISTS tc_tasks_lead_id_idx     ON public.tc_tasks(lead_id);

-- ── tc_proposals ──────────────────────────────────────────────────────────────
-- Proposal documents linked to leads, sent to potential clients.
CREATE TABLE IF NOT EXISTS public.tc_proposals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  content_html  TEXT,
  amount_inr    NUMERIC(14,2),
  valid_until   DATE,
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','sent','viewed','accepted','rejected')),
  created_by    UUID        NOT NULL REFERENCES public.profiles(id),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tc_proposals_lead_id_idx    ON public.tc_proposals(lead_id);
CREATE INDEX IF NOT EXISTS tc_proposals_created_by_idx ON public.tc_proposals(created_by);
CREATE INDEX IF NOT EXISTS tc_proposals_status_idx     ON public.tc_proposals(status);

-- ── tc_deals ─────────────────────────────────────────────────────────────────
-- Deal pipeline linked to leads, managed by telecallers.
CREATE TABLE IF NOT EXISTS public.tc_deals (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID        REFERENCES public.leads(id) ON DELETE SET NULL,
  title               TEXT        NOT NULL,
  stage               TEXT        NOT NULL DEFAULT 'Qualification'
                                  CHECK (stage IN ('Qualification','Proposal Sent','Negotiation','Closed Won','Closed Lost')),
  amount_inr          NUMERIC(14,2),
  expected_close_date DATE,
  probability         INT         CHECK (probability BETWEEN 0 AND 100),
  notes               TEXT,
  assigned_to         UUID        REFERENCES public.profiles(id),
  created_by          UUID        NOT NULL REFERENCES public.profiles(id),
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tc_deals_lead_id_idx    ON public.tc_deals(lead_id);
CREATE INDEX IF NOT EXISTS tc_deals_created_by_idx ON public.tc_deals(created_by);
CREATE INDEX IF NOT EXISTS tc_deals_stage_idx      ON public.tc_deals(stage);
