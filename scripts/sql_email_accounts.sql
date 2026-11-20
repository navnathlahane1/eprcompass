-- ============================================================
-- Email Accounts — Gmail OAuth integration for Intel staging
-- Run once in Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  provider    TEXT NOT NULL DEFAULT 'gmail',
  access_token  TEXT,
  refresh_token TEXT NOT NULL,
  token_expiry  TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  last_history_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON public.email_accounts(user_id);
