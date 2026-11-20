/**
 * POST /api/academy/ai/training-plan
 * AI Training Planner — identifies stakeholder coverage gaps from real program
 * history and generates a quarterly training plan.
 *
 * Uses Anthropic if configured (ANTHROPIC_API_KEY); otherwise falls back to
 * deterministic, coverage-based guidance so the feature is always usable.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

const MODELS = ['claude-sonnet-4-6', 'claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest'];

const CATEGORIES = ['Plastic Waste', 'E-Waste', 'Battery Waste', 'Tyre Waste', 'Used Oil'];
const STAKEHOLDERS = ['Producers', 'Importers', 'Brand Owners', 'Recyclers', 'Distributors'];

interface Gap {
  category: string;
  stakeholder: string;
  priority: 'High' | 'Medium' | 'Low';
  programs_needed: number;
  last_covered: string;
  recommendation: string;
}

interface Plan {
  title: string;
  programs: number;
  reach: number;
  compliance_score: number;
  budget_est: string;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function priorityFor(days: number): 'High' | 'Medium' | 'Low' {
  if (days > 180) return 'High';
  if (days > 90) return 'Medium';
  return 'Low';
}

function buildFallbackGaps(
  categories: string[],
  lastCovered: Record<string, { date: string | null; count: number }>
): Gap[] {
  const gaps: Gap[] = [];
  for (const category of categories) {
    const info = lastCovered[category] ?? { date: null, count: 0 };
    const days = daysSince(info.date);
    if (days <= 60 && info.count >= 2) continue; // well covered — skip

    const stakeholder = STAKEHOLDERS[gaps.length % STAKEHOLDERS.length];
    const priority = priorityFor(days);
    gaps.push({
      category,
      stakeholder,
      priority,
      programs_needed: priority === 'High' ? 3 : priority === 'Medium' ? 2 : 1,
      last_covered: info.date ? new Date(info.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never',
      recommendation: info.date
        ? `Schedule a refresher for ${stakeholder.toLowerCase()} — last ${category} program was ${days} days ago.`
        : `No ${category} program has been run yet — schedule an initial awareness session for ${stakeholder.toLowerCase()}.`,
    });
  }
  return gaps.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'High' ? -1 : 1));
}

function buildFallbackPlan(quarter: string, gaps: Gap[]): Plan {
  const programs = Math.max(gaps.length, 1);
  return {
    title: `${quarter} Coverage Recovery Plan`,
    programs,
    reach: programs * 85,
    compliance_score: Math.max(40, 100 - gaps.filter(g => g.priority === 'High').length * 15),
    budget_est: `₹${(programs * 45_000).toLocaleString('en-IN')}`,
  };
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const quarter = String(body.quarter || 'This quarter');
  const focus = String(body.focus || 'All Waste Categories');
  const categories = focus === 'All Waste Categories' ? CATEGORIES : [focus];

  const db = getServiceClient();
  const { data: programs } = await db
    .from('academy_programs')
    .select('waste_category, start_date, status')
    .in('waste_category', categories)
    .order('start_date', { ascending: false });

  const lastCovered: Record<string, { date: string | null; count: number }> = {};
  for (const category of categories) {
    const rows = (programs ?? []).filter(p => p.waste_category === category);
    lastCovered[category] = { date: rows[0]?.start_date ?? null, count: rows.length };
  }

  const gaps = buildFallbackGaps(categories, lastCovered);
  let plan = buildFallbackPlan(quarter, gaps);

  const apiKey = String(process.env.ANTHROPIC_API_KEY || '').trim();
  if (apiKey && gaps.length > 0) {
    const prompt = `You are the EPR Academy training planner. Given these compliance-training coverage gaps for ${quarter} (focus: ${focus}):
${JSON.stringify(gaps, null, 2)}

Return ONLY strict JSON (no markdown, no prose) with this exact shape:
{"plan": {"title": string, "programs": number, "reach": number, "compliance_score": number (0-100), "budget_est": string (Indian rupee format, e.g. "₹1,80,000")}}
Base "programs" on the sum of programs_needed across gaps. Keep numbers realistic for an Indian EPR training academy.`;

    for (const model of MODELS) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model, max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
        });
        if (res.ok) {
          const payload = await res.json();
          const text = String(payload?.content?.[0]?.text ?? '').trim();
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed?.plan?.title) {
              plan = parsed.plan;
              break;
            }
          }
        } else if (res.status === 401) {
          break;
        }
      } catch { /* try next model, or keep fallback plan */ }
    }
  }

  return NextResponse.json({ gaps, plan });
}
