import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const revalidate = 1800;

const STAGES = ['Visitor', 'Lead', 'Qualified', 'Proposal', 'Won'];

function monthKey(dateLike?: string | null) {
  if (!dateLike) return null;
  return String(dateLike).slice(0, 7);
}

async function validateAdminManager() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { supabase, ok: false as const };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return { supabase, ok: ['admin', 'manager'].includes(profile?.role || '') };
}

export async function GET() {
  const { supabase, ok } = await validateAdminManager();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5, 1));
  const { data: rows, error } = await (supabase as any)
    .from('leads')
    .select('id, source, stage, created_at, converted_at, service_interest')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leads = rows || [];

  const stageCounts = new Map<string, number>();
  for (const stage of STAGES) stageCounts.set(stage, 0);

  for (const lead of leads) {
    const stage = String(lead.stage || '');
    if (stage === 'New' || stage === 'Contacted') {
      stageCounts.set('Lead', Number((stageCounts.get('Lead') || 0) + 1));
    } else if (stageCounts.has(stage)) {
      stageCounts.set(stage, Number((stageCounts.get(stage) || 0) + 1));
    }
  }

  const visitorBase = Number((stageCounts.get('Lead') || 0) * 4);
  stageCounts.set('Visitor', visitorBase);

  const funnel = STAGES.map((stage, idx) => {
    const value = Number(stageCounts.get(stage) || 0);
    const prev = idx === 0 ? value : Number(stageCounts.get(STAGES[idx - 1]) || 0);
    return {
      stage,
      value,
      conversionPct: prev ? Number(((value / prev) * 100).toFixed(2)) : 0
    };
  });

  const sourceAgg = new Map<string, { total: number; won: number }>();
  for (const lead of leads) {
    const key = String(lead.source || 'Unknown');
    const current = sourceAgg.get(key) || { total: 0, won: 0 };
    current.total += 1;
    if (lead.stage === 'Won') current.won += 1;
    sourceAgg.set(key, current);
  }

  const sources = Array.from(sourceAgg.entries())
    .map(([source, value]) => ({
      source,
      count: value.total,
      conversionRate: value.total ? Number(((value.won / value.total) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const monthMap = new Map<string, number>();
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + i, 1));
    monthMap.set(d.toISOString().slice(0, 7), 0);
  }

  for (const lead of leads) {
    const mk = monthKey(lead.created_at);
    if (mk && monthMap.has(mk)) {
      monthMap.set(mk, Number((monthMap.get(mk) || 0) + 1));
    }
  }

  const trend = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const velocityMap = new Map<string, { totalDays: number; count: number }>();
  for (const lead of leads) {
    if (!lead.converted_at || lead.stage !== 'Won') continue;

    const created = new Date(lead.created_at);
    const converted = new Date(lead.converted_at);
    const diffDays = Math.max(0, Math.round((converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));

    const services = Array.isArray(lead.service_interest) && lead.service_interest.length
      ? lead.service_interest
      : ['General'];

    for (const service of services) {
      const key = String(service || 'General');
      const current = velocityMap.get(key) || { totalDays: 0, count: 0 };
      current.totalDays += diffDays;
      current.count += 1;
      velocityMap.set(key, current);
    }
  }

  const velocity = Object.fromEntries(
    Array.from(velocityMap.entries()).map(([serviceType, value]) => [
      serviceType,
      value.count ? Number((value.totalDays / value.count).toFixed(2)) : 0
    ])
  );

  return NextResponse.json({ funnel, sources, trend, velocity });
}
