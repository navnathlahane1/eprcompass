import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api/requireActor';
import { adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { operationalInsights } from '@/lib/admin/operationalInsights';

type InsightType = 'risk' | 'opportunity' | 'alert' | 'trend';

type Insight = {
  type: InsightType;
  priority: 1 | 2 | 3;
  title: string;
  detail: string;
  action: string;
};

function safeParseInsights(text: string): Insight[] {
  const trimmed = String(text || '').trim();
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  const jsonText = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;

  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        type: ['risk', 'opportunity', 'alert', 'trend'].includes(item?.type) ? item.type : 'trend',
        priority: [1, 2, 3].includes(item?.priority) ? item.priority : 2,
        title: String(item?.title || '').slice(0, 64),
        detail: String(item?.detail || '').slice(0, 180),
        action: String(item?.action || '').slice(0, 120)
      }))
      .slice(0, 6) as Insight[];
  } catch {
    return [];
  }
}

async function validateAdminManager() {
  const { deny } = await requireAdminSession();
  return { supabase: deny ? null : adminClient(), deny };
}

export async function POST(request: Request) {
  try {
  const { supabase, deny } = await validateAdminManager();
  if (deny) return deny;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid dashboard context' }, { status: 400 });
  const context = body.context || {};
  const fallback = () => NextResponse.json({
    insights: operationalInsights(context), generated_at: new Date().toISOString(), cached: false,
    source: 'rules', notice: 'AI generation is unavailable. Showing rules-based checks from the dashboard figures.',
  });

  const { data: cached } = await (supabase as any)
    .from('ai_insights_cache')
    .select('id, generated_at, insights')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached?.generated_at) {
    const ageMs = Date.now() - new Date(cached.generated_at).getTime();
    if (ageMs < 6 * 60 * 60 * 1000) {
      return NextResponse.json({ insights: cached.insights || [], generated_at: cached.generated_at, cached: true, source: 'ai' });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback();

  const system = `You are an EPR compliance business analyst for EPR Compass, an Indian EPR consultancy.
Analyze the dashboard data and return exactly 6 business insights as JSON array.
Each insight: { type: 'risk'|'opportunity'|'alert'|'trend', priority: 1-3, title: string (max 8 words), detail: string (max 25 words), action: string (max 15 words) }
Return ONLY the JSON array. No preamble.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(context)
        }
      ]
    })
  }).catch(() => null);

  if (!response?.ok) return fallback();

  const payload = await response.json();
  const text = String(payload?.content?.[0]?.text || '[]');
  const insights = safeParseInsights(text);

  if (!insights.length) return fallback();

  const { data: inserted, error: insertError } = await (supabase as any)
    .from('ai_insights_cache')
    .insert({ insights })
    .select('generated_at')
    .single();

  return NextResponse.json({ insights, generated_at: inserted?.generated_at || new Date().toISOString(), cached: false, source: 'ai', cacheStored: !insertError });
  } catch {
    return NextResponse.json({ error: 'Insights could not be loaded. Please retry.' }, { status: 503 });
  }
}

