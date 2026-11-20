import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

const SYSTEM_PROMPT = `You are an expert EPR (Extended Producer Responsibility) compliance assistant for the EPR Compass platform (EPR Compass). You assist admin staff and compliance managers with:

- EPR regulations in India (Plastic Waste Management Rules, E-Waste Management Rules, Battery Waste Management Rules, Tyre Waste Management Rules)
- CPCB (Central Pollution Control Board) registration and compliance
- Client onboarding, compliance status, and filing deadlines
- PRO (Producer Responsibility Organisation) processes
- Recycler verification and credit trading
- EPR certificates, filings, and documentation
- PIBOs (Producers, Importers, Brand Owners) and their obligations
- Waste categories: Plastic, E-Waste, Battery, Tyre, Oil

You are precise, professional, and concise. When you don't know something specific to this platform's data, say so clearly. Do not fabricate compliance details or regulatory figures.`;

export async function POST(req: NextRequest) {
  // Auth guard — admin-only
  const actor = await resolveActor();
  if (!actor) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!actor.isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Claude API key not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let messages: { role: 'user' | 'assistant'; content: string }[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('Invalid messages');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = new Anthropic({ apiKey });

  // Stream the response back to the client using Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages,
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Claude API error';
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    },
  });
}


