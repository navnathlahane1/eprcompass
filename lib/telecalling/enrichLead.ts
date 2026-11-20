import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_PROMPT_TEMPLATE = `You are a B2B lead intelligence engine for an Indian EPR compliance consultancy.
Analyze this company and return STRICT JSON only (no markdown, no explanation):
Name: {{company_name}}
State: {{state}}
Industry: {{industry}}
Contact: {{contact_name}}

{
  "industry_inferred": "string",
  "size_estimate": "Micro|Small|Medium|Large|Enterprise",
  "epr_category": "PIBO|Importer|Brand Owner|Recycler|Unknown",
  "epr_applicability_score": 0,
  "lead_score": 0,
  "compliance_probability": 0,
  "decision_maker_estimate": "string",
  "ai_summary": "2-3 sentence intelligence summary for sales team",
  "recommended_pitch": "string"
}`;

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function fillTemplate(template: string, lead: Record<string, any>): string {
  return template
    .replace(/\{\{company_name\}\}/g, lead.company_name || 'Unknown')
    .replace(/\{\{state\}\}/g, lead.state || 'India')
    .replace(/\{\{industry\}\}/g, lead.industry || 'Unknown')
    .replace(/\{\{contact_name\}\}/g, lead.name || 'Unknown');
}

function parseJsonFromText(text: string): Record<string, any> | null {
  const stripped = text.replace(/```json?\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function enrichLead(leadId: string, supabase?: SupabaseClient): Promise<void> {
  const db = supabase ?? makeServiceClient();

  // Mark as processing
  await db.from('tc_enrichment_queue')
    .update({ status: 'processing', last_attempted_at: new Date().toISOString() })
    .eq('lead_id', leadId);

  // Fetch lead data from the leads table
  const { data: lead, error: leadError } = await db
    .from('leads')
    .select('id, company_name, name, state, city, industry')
    .eq('id', leadId)
    .maybeSingle();

  if (leadError || !lead) {
    await db.from('tc_enrichment_queue').update({ status: 'failed', error: 'Lead not found' }).eq('lead_id', leadId);
    return;
  }

  // Load prompt template
  const { data: settingRow } = await db
    .from('tc_settings')
    .select('value')
    .eq('key', 'enrichment_prompt_template')
    .maybeSingle();

  const template = settingRow?.value || DEFAULT_PROMPT_TEMPLATE;
  const prompt = fillTemplate(template, lead);

  let rawText = '';
  let parsed: Record<string, any> | null = null;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    rawText = message.content[0]?.type === 'text' ? message.content[0].text : '';
    parsed = parseJsonFromText(rawText);
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    await db.from('tc_enrichment_queue').update({ status: 'failed', error: errMsg }).eq('lead_id', leadId);
    await db.from('leads').update({ tc_enrichment_status: 'failed' }).eq('id', leadId);
    return;
  }

  if (!parsed) {
    await db.from('tc_enrichment_queue').update({ status: 'failed', error: 'Failed to parse JSON from Claude response' }).eq('lead_id', leadId);
    await db.from('leads').update({ tc_enrichment_status: 'failed' }).eq('id', leadId);
    return;
  }

  // Upsert enrichment result
  await db.from('tc_lead_enrichments').upsert({
    lead_id: leadId,
    ai_summary: parsed.ai_summary || null,
    industry_inferred: parsed.industry_inferred || null,
    size_estimate: parsed.size_estimate || null,
    epr_category: parsed.epr_category || null,
    epr_applicability_score: typeof parsed.epr_applicability_score === 'number' ? parsed.epr_applicability_score : null,
    lead_score: typeof parsed.lead_score === 'number' ? parsed.lead_score : null,
    decision_maker_estimate: parsed.decision_maker_estimate || null,
    compliance_probability: typeof parsed.compliance_probability === 'number' ? parsed.compliance_probability : null,
    recommended_pitch: parsed.recommended_pitch || null,
    enrichment_source: 'claude',
    model_used: 'claude-sonnet-4-6',
    raw_response: { text: rawText, parsed },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'lead_id' });

  // Mark complete
  await db.from('tc_enrichment_queue').update({ status: 'done', updated_at: new Date().toISOString() }).eq('lead_id', leadId);
  await db.from('leads').update({ tc_enrichment_status: 'done' }).eq('id', leadId);

  // Sync to intel_companies + intel_company_fact_sheets
  const companyName = (lead.company_name || '').trim();
  if (companyName) {
    const { data: existing } = await db
      .from('intel_companies')
      .select('id')
      .ilike('canonical_name', companyName)
      .limit(1)
      .maybeSingle();

    let companyId: string | null = existing?.id ?? null;

    if (!companyId) {
      const { data: created } = await db.from('intel_companies').insert({
        canonical_name: companyName,
        state: lead.state || null,
      }).select('id').single();
      companyId = created?.id ?? null;
    }

    if (companyId) {
      await db.from('intel_company_fact_sheets').upsert({
        company_id: companyId,
        city: lead.city || null,
        segment_tag: parsed.epr_category || null,
        relevance_score: typeof parsed.epr_applicability_score === 'number' ? parsed.epr_applicability_score : null,
        notes: parsed.ai_summary || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id' });
    }
  }
}
