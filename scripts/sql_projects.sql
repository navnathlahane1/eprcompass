-- ============================================================
-- Project Management Module
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Low','Medium','High','Critical')),
  category TEXT DEFAULT 'general'
    CHECK (category IN ('proposal','filing','onboarding','operations','general')),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  start_date DATE,
  end_date DATE,
  target_proposals INT DEFAULT 0,
  target_filings INT DEFAULT 0,
  target_clients INT DEFAULT 0,
  budget_inr NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('lead','member','reviewer','observer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general'
    CHECK (category IN ('proposal','filing','onboarding','escalation','general')),
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','review','blocked','done','cancelled')),
  priority TEXT NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Low','Medium','High','Urgent')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  due_date TIMESTAMPTZ,
  sla_hours INT,
  actual_hours NUMERIC(5,2),
  completed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  depends_on UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL
    CHECK (warning_type IN ('sla_breach','overdue','blocked_too_long','no_activity','dependency_risk','member_overloaded')),
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_project_id ON public.project_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_project_warnings_project_id ON public.project_warnings(project_id, resolved);
