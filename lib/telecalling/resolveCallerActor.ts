import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const p = JSON.parse(raw);
    if (typeof p === 'string') return p;
    if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
    if (p?.access_token) return p.access_token;
  } catch {}
  return raw;
}

export type CallerActor = {
  id: string;
  role: string;
  fullName: string;
  db: ReturnType<typeof makeServiceClient>;
};

export const ALL_TC_ROLES = [
  'telecaller', 'tc_team_lead', 'tc_senior_agent', 'tc_quality_analyst',
  'tc_campaign_manager', 'tc_trainer', 'admin', 'manager', 'sales-executive',
];

export async function resolveCallerActor(allowedRoles: string[] = ALL_TC_ROLES): Promise<CallerActor | null> {
  const db = makeServiceClient();
  const cookieStore = await cookies();
  const raw = cookieStore.getAll().find(c =>
    c.name.endsWith('-access-token') || c.name === 'sb-access-token' || c.name.endsWith('-auth-token')
  );
  const token = tryParseToken(raw?.value);
  if (!token) return null;
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await db.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
  if (!allowedRoles.includes(profile?.role ?? '')) return null;
  return { id: user.id, role: profile?.role ?? '', fullName: profile?.full_name ?? '', db };
}
