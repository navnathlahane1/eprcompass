/**
 * GET    /api/recycler-portal/ai-assistant  — chat history
 * POST   /api/recycler-portal/ai-assistant  — send a message, get an AI reply
 * DELETE /api/recycler-portal/ai-assistant  — clear history
 *
 * Uses Anthropic if configured (ANTHROPIC_API_KEY); otherwise falls back to
 * structured rule-based guidance so the feature is always usable.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

const MODELS = ['claude-sonnet-4-6', 'claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest'];

const rateLimit = new Map<string, { count: number; resetAt: number }>();
function allow(userId: string): boolean {
  const now = Date.now();
  const e = rateLimit.get(userId);
  if (!e || now > e.resetAt) { rateLimit.set(userId, { count: 1, resetAt: now + 3600_000 }); return true; }
  if (e.count >= 30) return false;
  e.count += 1; return true;
}

function systemPrompt(ctx: { name: string; categories: string[]; states: string[] }): string {
  return `You are the EPR Compliance Assistant for ${ctx.name}, a recycler on localhost:3000.

Their EPR categories: ${ctx.categories.join(', ') || 'not set'}.
Authorized states: ${ctx.states.join(', ') || 'not set'}.

Guidelines:
- Answer in clear Indian business English, concise and practical.
- Focus on Indian EPR: CPCB / MoEF&CC / SPCB rules, recycler obligations, EPR credit generation, return filing, traceability, CTO/CTE & hazardous-waste authorizations.
- Be specific to the recycler's categories where relevant.
- If unsure of an exact figure, date, or notification number, say "⚠️ Please verify the latest CPCB notification."
- Never fabricate penalties, fees, or deadlines.

Format: a short direct answer, then a brief "Next steps" list when actionable.
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function fallbackReply(q: string, ctx: { categories: string[] }): string {
  const cat = ctx.categories[0] || 'your waste category';
  return `Here's general guidance (AI service not configured, so this is rule-based):

For **${cat}** EPR compliance as a recycler, the key recurring obligations are:
• Maintain CPCB registration and file periodic returns on the CPCB EPR portal.
• Keep SPCB Consent to Operate (CTO) and Hazardous Waste authorization current — track them under **Authorizations**.
• Record genuine processing in the **Traceability Ledger** so every EPR credit is backed by verifiable inflow → processing data.
• Reconcile processed tonnage before generating credits.

Next steps:
1. Check your **CPCB Returns** page for upcoming filing deadlines.
2. Ensure each issued credit links to a traceability batch.
3. For specific notifications, ⚠️ verify the latest CPCB circular.

(Ask your compliance officer via Service Requests for case-specific advice.)`;
}

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_ai_messages')
    .select('id, role, content, sources, created_at')
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ messages: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allow(actor.userId)) return NextResponse.json({ error: 'Rate limit reached. Try again in an hour.' }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || '').trim().slice(0, 2000);
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

  const db = adminClient();
  const ctx = { name: actor.name, categories: actor.eprCategories, states: actor.authorizedStates };

  // Persist the user message
  await (db as any).from('recycler_ai_messages').insert({
    recycler_id: actor.recyclerId, user_id: actor.userId, role: 'user', content: message,
  }).then((r: any) => r, () => {});

  // Load recent history for context
  const { data: history } = await (db as any)
    .from('recycler_ai_messages')
    .select('role, content')
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: true })
    .limit(20)
    .then((r: any) => r, () => ({ data: [] }));

  const convo = (history ?? []).map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  if (!convo.length || convo[convo.length - 1]?.content !== message) convo.push({ role: 'user', content: message });

  const apiKey = String(process.env.ANTHROPIC_API_KEY || '').trim();
  let reply = '';

  if (apiKey) {
    for (const model of MODELS) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model, max_tokens: 800, system: systemPrompt(ctx), messages: convo }),
        });
        if (res.ok) {
          const payload = await res.json();
          reply = String(payload?.content?.[0]?.text ?? '').trim();
          if (reply) break;
        } else if (res.status === 401) {
          break;
        }
      } catch { /* try next model */ }
    }
  }

  if (!reply) reply = fallbackReply(message, ctx);

  // Persist assistant reply
  await (db as any).from('recycler_ai_messages').insert({
    recycler_id: actor.recyclerId, user_id: actor.userId, role: 'assistant', content: reply,
  }).then((r: any) => r, () => {});

  return NextResponse.json({ reply });
}

export async function DELETE() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = adminClient();
  await (db as any).from('recycler_ai_messages').delete().eq('recycler_id', actor.recyclerId);
  return NextResponse.json({ ok: true });
}
