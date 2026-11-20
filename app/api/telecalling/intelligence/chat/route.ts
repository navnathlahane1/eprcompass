import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { formatRagContext, searchRegulatoryNotificationChunks } from '@/lib/telecalling/notificationIntel';

const ALLOWED_ROLES = new Set(['telecaller', 'manager', 'admin']);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 40) return false;
  entry.count += 1;
  return true;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

const DEFAULT_ANTHROPIC_MODELS = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-latest',
  'claude-3-5-sonnet-latest',
];

async function readSettingValue(key: string): Promise<string> {
  try {
    const db = adminClient();
    const { data } = await db
      .from('tc_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    return String(data?.value || '').trim();
  } catch {
    return '';
  }
}

async function resolveAnthropicApiKey(): Promise<string> {
  const settingsKey = await readSettingValue('anthropic_api_key');
  if (settingsKey) return settingsKey;

  const envKey = String(process.env.ANTHROPIC_API_KEY || '').trim();
  if (envKey) return envKey;

  return '';
}

async function resolveAnthropicModel(): Promise<string> {
  const envModel = String(process.env.ANTHROPIC_MODEL || '').trim();
  if (envModel) return envModel;

  return readSettingValue('anthropic_model');
}

function buildAnthropicDiagnostic(status: number, errorText: string, model: string): string {
  const lower = (errorText || '').toLowerCase();

  if (status === 401 || lower.includes('invalid x-api-key') || lower.includes('authentication')) {
    return `Anthropic authentication failed for model ${model}. Verify API key in Vercel env/admin settings.`;
  }

  if (status === 429 || lower.includes('rate limit') || lower.includes('quota') || lower.includes('credit')) {
    return `Anthropic quota/rate limit hit for model ${model}. Check account limits and billing.`;
  }

  if (status === 400 || status === 404 || lower.includes('model') || lower.includes('not found')) {
    return `Anthropic model issue for ${model}. The model may be unavailable for this key/account.`;
  }

  return `Anthropic request failed (status ${status}) for model ${model}.`;
}

async function resolveRole(userId: string): Promise<string> {
  try {
    const db = adminClient();
    const { data } = await db.from('profiles').select('role').eq('id', userId).maybeSingle();
    return String(data?.role || '').toLowerCase();
  } catch {
    return '';
  }
}

function buildSystemPrompt(notificationContext: string): string {
  return `You are a Telecalling Intelligence Assistant for localhost:3000.

Primary user: Telecalling executives and managers handling EPR compliance sales and support calls.

You must:
- Provide concise call-ready answers in plain Indian business English.
- Prioritize Indian EPR context: CPCB, MoEF&CC, SPCB, PIBO, PRO, recyclers.
- Use only supported facts; do not fabricate notification numbers, dates, penalties, or fees.
- If exact details are uncertain, explicitly say: "⚠️ VERIFY LATEST".
- When relevant, suggest the next call action (qualify, document request, follow-up timeline).

Output format:
1) Direct answer (3-6 bullets)
2) Objection-ready one-liner for telecaller
3) Suggested next step
4) Sources used (if available)

${notificationContext}

Date context: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = await resolveRole(user.id);
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const messages: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body?.messages)
      ? body.messages.slice(-20)
      : [];

    if (!messages.length || messages[messages.length - 1]?.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    const userQuery = String(messages[messages.length - 1]?.content || '').slice(0, 2000);
    const matchedChunks = await searchRegulatoryNotificationChunks(userQuery, 8);
    const notificationContext = formatRagContext(matchedChunks);

    const apiKey = await resolveAnthropicApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Add ANTHROPIC_API_KEY in env or Telecalling Settings.' },
        { status: 503 }
      );
    }

    const preferredModel = await resolveAnthropicModel();
    const modelsToTry = Array.from(new Set([preferredModel, ...DEFAULT_ANTHROPIC_MODELS].filter(Boolean)));

    let reply = '';
    const diagnostics: string[] = [];

    for (const model of modelsToTry) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 700,
          system: buildSystemPrompt(notificationContext),
          messages: messages.map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
        }),
      });

      if (claudeRes.ok) {
        const payload = await claudeRes.json();
        reply = String(payload?.content?.[0]?.text ?? '').trim();
        if (reply) break;
        diagnostics.push(`Empty response for model ${model}.`);
        continue;
      }

      const errText = await claudeRes.text();
      const diagnostic = buildAnthropicDiagnostic(claudeRes.status, errText, model);
      diagnostics.push(diagnostic);
      console.error('[telecalling-intelligence] Claude error:', claudeRes.status, { model, errText });

      if (claudeRes.status === 401) break;
    }

    if (!reply) {
      return NextResponse.json(
        {
          error: diagnostics[0] || 'AI service temporarily unavailable',
          triedModels: modelsToTry,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply,
      sources: matchedChunks.map((m) => ({
        title: m.title,
        category: m.category,
        sourceUrl: m.sourceUrl,
        publishedAt: m.publishedAt || null,
        excerpt: m.excerpt,
        score: m.score,
      })),
    });
  } catch (err) {
    console.error('[telecalling-intelligence] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
