-- ============================================================
-- Project Management Module — Patch
-- Run this in Supabase Dashboard > SQL Editor
-- Safe to run multiple times
-- ============================================================

-- Add resolved_by column to project_warnings (if not exists)
ALTER TABLE public.project_warnings
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id);

-- Update priority check on project_tasks to include Critical
ALTER TABLE public.project_tasks
  DROP CONSTRAINT IF EXISTS project_tasks_priority_check;

ALTER TABLE public.project_tasks
  ADD CONSTRAINT project_tasks_priority_check
  CHECK (priority IN ('Low','Medium','High','Urgent','Critical'));
