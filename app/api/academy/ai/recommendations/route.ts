/**
 * POST /api/academy/ai/recommendations
 * AI Training Recommendations — personalized training suggestions for a client
 * based on their EPR waste categories and existing certificate coverage.
 *
 * Uses Anthropic if configured (ANTHROPIC_API_KEY); otherwise falls back to
 * deterministic, category-based guidance so the feature is always usable.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

const MODELS = ['claude-sonnet-4-6', 'claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest'];

interface Recommendation {
  title: string;
  type: string;
  priority: 'Mandatory' | 'Recommended' | 'Optional';
  reason: string;
}

function fallbackRecommendations(companyName: string, categories: string[], hasCertificate: boolean): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const category of categories) {
    recs.push({
      title: `${category} EPR Compliance Certification`,
      type: 'Certification Course',
      priority: hasCertificate ? 'Recommended' : 'Mandatory',
      reason: hasCertificate
        ? `Refresher recommended — regulations for ${category.toLowerCase()} are updated periodically.`
        : `${companyName} has no recorded ${category} certification; this is required for EPR return filing.`,
    });
  }

  if (categories.length > 1) {
    recs.push({
      title: 'Multi-Category EPR Coordination Workshop',
      type: 'Workshop',
      priority: 'Recommended',
      reason: `${companyName} handles ${categories.length} waste categories — a coordination workshop reduces cross-category filing errors.`,
    });
  }

  recs.push({
    title: 'CPCB Portal & Annual Return Filing',
    type: 'Public Awareness',
    priority: 'Optional',
    reason: 'Keeps the compliance team current on CPCB portal workflow changes ahead of the annual return window.',
  });

  return recs;
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clientId = String(body.clientId || '').trim();
  if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 });

  const db = getServiceClient();
  const { data: client, error } = await db
    .from('clients')
    .select('id, company_name, waste_categories, industry')
    .eq('id', clientId)
    .maybeSingle();

  if (error || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const companyName = client.company_name || 'This client';
  const categories: string[] = Array.isArray(client.waste_categories) && client.waste_categories.length
    ? client.waste_categories
    : ['Plastic Waste'];

  const { count: certCount } = await db
    .from('academy_certificates')
    .select('id', { count: 'exact', head: true })
    .eq('participant_name', companyName);

  const hasCertificate = (certCount ?? 0) > 0;
  let recommendations = fallbackRecommendations(companyName, categories, hasCertificate);

  const apiKey = String(process.env.ANTHROPIC_API_KEY || '').trim();
  if (apiKey) {
    const prompt = `You are the EPR Academy training advisor. Client "${companyName}" (industry: ${client.industry || 'unspecified'}) has these EPR waste categories: ${categories.join(', ')}. They ${hasCertificate ? 'already have at least one academy certificate on file' : 'have no academy certificates on file'}.

Return ONLY strict JSON (no markdown, no prose) with this exact shape:
{"recommendations": [{"title": string, "type": string, "priority": "Mandatory"|"Recommended"|"Optional", "reason": string}]}
Give 3-5 recommendations specific to Indian EPR compliance training. Reference the client's actual categories in the reasons.`;

    for (const model of MODELS) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model, max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
        });
        if (res.ok) {
          const payload = await res.json();
          const text = String(payload?.content?.[0]?.text ?? '').trim();
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed?.recommendations) && parsed.recommendations.length) {
              recommendations = parsed.recommendations;
              break;
            }
          }
        } else if (res.status === 401) {
          break;
        }
      } catch { /* try next model, or keep fallback recommendations */ }
    }
  }

  return NextResponse.json({ recommendations });
}
