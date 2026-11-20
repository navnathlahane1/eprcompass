/**
 * POST /api/ai/compliance-chat
 *
 * AI Compliance Assistant — available to all authenticated users.
 * Builds a personalised system prompt from the user's live EPR data,
 * then forwards the conversation to Claude and returns the reply.
 *
 * Body:  { messages: {role:'user'|'assistant', content:string}[], sessionId?: string }
 * Reply: { reply: string, sessionId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

// ─── helpers ─────────────────────────────────────────────────────────────────

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

/** Safe single-table fetch — returns [] on any error so context building never crashes. */
async function safeFetch(db: any, table: string, query: (q: any) => any): Promise<any[]> {
  try {
    const { data } = await query(db.from(table));
    return data ?? [];
  } catch {
    return [];
  }
}

// ─── context builder ─────────────────────────────────────────────────────────

async function buildUserContext(userId: string): Promise<string> {
  const db = adminClient();

  const [profile, filings, checklist, notifications, score] = await Promise.all([
    // Profile
    safeFetch(db, 'profiles', (q) =>
      q.select('full_name, company_name, role, state, city').eq('id', userId).maybeSingle()
    ),
    // EPR filing statuses — last 8 entries
    safeFetch(db, 'epr_filing_statuses', (q) =>
      q
        .select('category, status, financial_year, updated_at, remarks')
        .eq('client_id', userId)
        .order('updated_at', { ascending: false })
        .limit(8)
    ),
    // EPR checklist — pending items
    safeFetch(db, 'epr_checklist_items', (q) =>
      q
        .select('title, status, due_date, category')
        .eq('client_id', userId)
        .in('status', ['Pending', 'Overdue', 'In Progress'])
        .order('due_date', { ascending: true })
        .limit(8)
    ),
    // Recent unread notifications
    safeFetch(db, 'epr_notification_queue', (q) =>
      q
        .select('type, payload, created_at')
        .eq('recipient_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(5)
    ),
    // Latest compliance score (any year)
    safeFetch(db, 'epr_compliance_scores', (q) =>
      q
        .select('financial_year, score, epr_type')
        .eq('client_id', userId)
        .is('epr_type', null)
        .order('computed_at', { ascending: false })
        .limit(1)
    ),
  ]);

  const p = Array.isArray(profile) ? profile[0] : profile;
  const scoreRow = score[0];

  let ctx = `USER PROFILE:\n`;
  ctx += `  Company: ${p?.company_name ?? 'Unknown'}\n`;
  ctx += `  Name: ${p?.full_name ?? 'Unknown'}\n`;
  ctx += `  Role: ${p?.role ?? 'client'}\n`;
  ctx += `  State: ${p?.state ?? 'Not set'}\n\n`;

  if (scoreRow) {
    ctx += `EPR COMPLIANCE SCORE: ${scoreRow.score}/100 (FY ${scoreRow.financial_year})\n\n`;
  }

  if (filings.length) {
    ctx += `RECENT EPR FILING STATUSES:\n`;
    for (const f of filings) {
      ctx += `  - [${f.category ?? 'EPR'}] FY ${f.financial_year}: ${f.status}${f.remarks ? ` — ${String(f.remarks).slice(0, 60)}` : ''}\n`;
    }
    ctx += '\n';
  }

  if (checklist.length) {
    ctx += `PENDING CHECKLIST ITEMS:\n`;
    for (const c of checklist) {
      ctx += `  - ${c.title} (${c.status}${c.due_date ? `, due ${c.due_date}` : ''})\n`;
    }
    ctx += '\n';
  }

  if (notifications.length) {
    ctx += `RECENT NOTIFICATIONS:\n`;
    for (const n of notifications) {
      const msg = n.payload?.message ?? n.payload?.title ?? n.type;
      ctx += `  - ${String(msg).slice(0, 80)}\n`;
    }
    ctx += '\n';
  }

  return ctx;
}

// ─── system prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(userContext: string): string {
  return `You are the AI Compliance Assistant for EPR Compass — India's leading EPR compliance platform operated by Neubrain Solutions Pvt. Ltd.

You help registered users understand and manage their EPR (Extended Producer Responsibility) compliance obligations under Indian environmental law.

YOUR EXPERTISE COVERS:
- Plastic Waste Management (PWM) Rules 2022 — CPCB/MoEFCC
- E-Waste Management Rules 2022
- Battery Waste Management Rules 2022
- Used Oil Management Rules
- Tyre Waste Management Rules
- EPR registration, annual returns, certificate procurement
- EPR credit generation, trading, and marketplace
- State-wise obligations and deadlines
- CPCB portal procedures and document requirements

TONE & FORMAT:
- Be concise (aim for under 150 words unless a detailed breakdown is requested)
- Use bullet points for multi-step answers
- Be specific to Indian regulations and use correct Indian terminology (e.g., "CPCB", "SPCB", "PWM Rules", "EPR Registration Certificate")
- When the user asks about their specific data, reference the context below
- If you don't know something, say so clearly and suggest they use the EPR Compass contact form.

CURRENT USER CONTEXT:
${userContext}

Today's date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
}

// ─── rate limiting (simple in-memory, per-process) ────────────────────────────
// Limits: 30 requests per user per hour

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count += 1;
  return true;
}

// ─── route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 });
    }

    // 3. Parse body
    const body = await req.json().catch(() => ({}));
    const messages: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body?.messages)
      ? body.messages.slice(-20) // keep last 20 turns max
      : [];
    const sessionId: string | undefined = body?.sessionId;

    if (!messages.length || messages[messages.length - 1]?.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    // Sanitize message content
    const sanitized = messages.map((m) => ({
      role: m.role,
      content: String(m.content ?? '').slice(0, 2000),
    }));

    // 4. Check Claude API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    // 5. Build context (fire all queries in parallel)
    const userContext = await buildUserContext(user.id);
    const system = buildSystemPrompt(userContext);

    // 6. Call Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system,
        messages: sanitized,
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error('[compliance-chat] Claude error:', claudeRes.status, errText);
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const claudePayload = await claudeRes.json();
    const reply = String(claudePayload?.content?.[0]?.text ?? '').trim();
    if (!reply) return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });

    // 7. Persist session (fire-and-forget)
    void persistSession(user.id, sessionId, sanitized, reply);

    return NextResponse.json({ reply, sessionId: sessionId ?? null });
  } catch (err: any) {
    console.error('[compliance-chat] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function persistSession(
  userId: string,
  sessionId: string | undefined,
  messages: any[],
  reply: string
) {
  try {
    const db = adminClient();
    const allMessages = [...messages, { role: 'assistant', content: reply }];

    if (sessionId) {
      await (db as any)
        .from('ai_chat_sessions')
        .update({ messages: allMessages, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId);
    } else {
      await (db as any)
        .from('ai_chat_sessions')
        .insert({ user_id: userId, messages: allMessages });
    }
  } catch {
    // Non-critical — chat still works without persistence
  }
}

