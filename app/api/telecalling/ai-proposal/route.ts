/**
 * POST /api/telecalling/ai-proposal
 * Reads a WhatsApp chat + pricing catalog → returns AI-generated proposal content.
 * Uses Google Gemini 2.0 Flash (free tier).
 */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ServiceRow {
  name: string;
  category: string;
  base_price_inr: number;
  gst_rate: number;
  unit: string;
  description: string | null;
  notes: string | null;
}

function buildPrompt(services: ServiceRow[], chatText: string): string {
  const catalog = services
    .map(s => {
      const total = s.base_price_inr * (1 + s.gst_rate / 100);
      return `- ${s.name} (${s.category}): ₹${total.toLocaleString('en-IN')} incl. ${s.gst_rate}% GST — ${s.unit}${s.description ? ` | ${s.description}` : ''}`;
    })
    .join('\n');

  return `You are an EPR (Extended Producer Responsibility) compliance sales expert at localhost:3000. Your job is to read a WhatsApp sales conversation and generate a professional proposal email.

## Our Service Catalog
${catalog}

## WhatsApp Chat
${chatText}

## Your Task
1. Identify the client name / company from the conversation.
2. Identify which EPR services they need based on the discussion.
3. Calculate a total amount in INR (use catalog prices; include GST).
4. Generate a professional HTML proposal email tailored to this client.

Return ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON — with exactly these fields:
{
  "title": "short proposal title (e.g. 'EPR Compliance Proposal – Acme Plastics')",
  "amount_inr": 59000,
  "client_name": "Company or person name from the chat",
  "services_matched": ["Service Name 1", "Service Name 2"],
  "content_html": "FULL HTML email body as a single string"
}

The content_html must be a complete, professional HTML email. Use inline styles only (no external CSS). Structure it with:
- A dark header (background #0f172a, padding 32px) with title "EPR Compliance Proposal" and subtitle "Prepared by EPR Compass" in white text
- A light body section (background #f8fafc, padding 32px, border 1px solid #e2e8f0)
- A personalised greeting using the client name
- A brief paragraph summarising their specific requirement from the chat
- An HTML table listing the matched services with columns: Service | Base Price | GST (18%) | Total
- A bold total row at the bottom of the table
- A paragraph: "This proposal is valid for 15 days from today (${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })})."
- A warm closing: "Warm regards, EPR Compass Team"

Make the HTML clean and email-client safe. All amounts in Indian Rupees with ₹ symbol. No external fonts or images.`;
}

export async function POST(req: NextRequest) {
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { chat_text?: string; lead_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const chatText = (body.chat_text ?? '').trim();
  if (!chatText) return NextResponse.json({ error: 'chat_text is required' }, { status: 400 });
  if (chatText.length < 20) return NextResponse.json({ error: 'Chat text is too short to generate a proposal' }, { status: 400 });

  // Fetch active services (actor.db is service-role client, bypasses RLS)
  const { data: services, error: dbErr } = await actor.db
    .from('service_pricing')
    .select('name, category, base_price_inr, gst_rate, unit, description, notes')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (dbErr) return NextResponse.json({ error: 'Failed to load pricing data' }, { status: 500 });

  const prompt = buildPrompt((services ?? []) as ServiceRow[], chatText);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4000,
    },
  });

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Strip accidental markdown fences Gemini sometimes adds
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed: {
    title: string;
    amount_inr: number;
    client_name: string;
    services_matched: string[];
    content_html: string;
  };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: 'AI returned an unexpected format. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    title: parsed.title ?? '',
    amount_inr: parsed.amount_inr ?? null,
    client_name: parsed.client_name ?? '',
    services_matched: parsed.services_matched ?? [],
    content_html: parsed.content_html ?? '',
  });
}

