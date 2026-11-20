// Prompt construction for the AI Content Studio.
// All AI calls go through server-side routes — no keys client-side.

export interface BrandVoiceData {
  tone_descriptors:  string[];
  content_pillars:   string[];
  trust_anchors:     string[];
  epr_terminology:   Record<string, string>;
  guardrail_list:    string[];
  hashtag_sets:      Record<string, string[]>;
  sample_posts?:     Record<string, Array<{ hook: string; body: string }>>;
}

const PLATFORM_GUIDELINES: Record<string, string> = {
  linkedin:        'LinkedIn post: 800–1800 chars, professional tone, 3–5 hashtags, clear single CTA, line breaks every 2–3 sentences.',
  twitter:         'X/Twitter post: ≤280 chars including hashtags, punchy hook, 2–3 hashtags, no filler.',
  facebook:        'Facebook post: 300–800 chars, conversational, 3–4 hashtags, question or CTA at end, emojis welcome.',
  instagram:       'Instagram caption: 100–300 chars before fold (hook up front), 10–15 hashtags at end, emoji-rich, visual storytelling.',
  youtube:         'YouTube description: 200–500 chars, keyword-rich, CTA to subscribe/watch, 3–5 hashtags.',
  tiktok:          'TikTok caption: ≤150 chars, trendy/casual tone, 3–5 hashtags, reference the visual hook in first 3 seconds.',
  pinterest:       'Pinterest description: 100–200 chars, descriptive, keyword-rich, 2–3 hashtags.',
  threads:         'Threads post: ≤500 chars, conversational/community-first, 2–3 hashtags.',
  google_business: 'Google Business post: 100–300 chars, local/service focus, one clear CTA (e.g. "Call now", "Learn more").',
  other:           'Social post: concise, punchy, one clear CTA.',
};

// ── System prompt ─────────────────────────────────────────────

export function buildBrandVoiceSystemPrompt(bv: BrandVoiceData): string {
  const terms = Object.entries(bv.epr_terminology)
    .map(([k, v]) => `  • ${k}: ${v}`)
    .join('\n');

  const guardrails = bv.guardrail_list
    .map(g => `  • "${g}"`)
    .join('\n');

  return `You are an expert marketing strategist and copywriter for EPR Compass, India's leading EPR (Extended Producer Responsibility) compliance consultancy and SaaS platform.

BRAND VOICE
Tone: ${bv.tone_descriptors.join(', ')}
Content Pillars: ${bv.content_pillars.join(' | ')}
Trust Anchors: ${bv.trust_anchors.join(' · ')}

EPR DOMAIN TERMINOLOGY — use these terms accurately and consistently:
${terms}

AUDIENCES WE SERVE
Producers, Importers, Brand Owners, Recyclers, and PROs regulated under CPCB across India, UAE, SE Asia, and Africa — managing Plastic, E-Waste, Battery, and Tyre waste streams.

ANTI-GREENWASHING GUARDRAILS — NEVER use the following unverifiable or misleading claims:
${guardrails}

Only make claims that are verifiable and backed by regulation, official certification, audited data, or published research. We are a compliance brand — accuracy and credibility are our core assets. When in doubt, omit the claim rather than overstate it.

Respond ONLY with valid JSON — no markdown fences, no explanation text, no preamble. The entire response must be parseable by JSON.parse().`;
}

// ── Strategy generator prompts ────────────────────────────────

export interface StrategyInputs {
  objective:        string;
  audience_segment: string;
  platforms:        string[];
  region:           string;
  time_horizon:     string;
  campaign_theme:   string;
}

export function buildStrategyUserPrompt(inputs: StrategyInputs): string {
  return `Generate a detailed marketing strategy for the following campaign:

Objective: ${inputs.objective}
Target Audience: ${inputs.audience_segment}
Platforms: ${inputs.platforms.join(', ')}
Region: ${inputs.region}
Time Horizon: ${inputs.time_horizon}
Campaign Theme: ${inputs.campaign_theme}

Return a single JSON object with this exact structure:
{
  "pillars": ["pillar1", "pillar2", "pillar3"],
  "cadence": { "platform": "X posts/week", ... },
  "channel_mix": { "platform": "X% of total effort", ... },
  "hook_angles": [
    "angle 1 — e.g. Fear of non-compliance penalties",
    "angle 2 — e.g. Cost savings via streamlined EPR",
    "angle 3 — e.g. Competitive advantage through certification",
    "angle 4 — e.g. Regulatory deadline urgency",
    "angle 5 — e.g. Peer/industry social proof"
  ],
  "calendar_draft": [
    { "week": 1, "day": "Mon", "platform": "linkedin", "topic": "...", "type": "educational|promotional|engagement|news|curated" },
    ...12 to 20 items spread across the time horizon...
  ],
  "strategic_notes": "2–3 sentences on the overall strategic rationale and key risks to watch."
}`;
}

// ── Performance feedback helpers ──────────────────────────────

export interface PerformerSnapshot {
  hook:            string;
  topic:           string | null;
  engagement_rate: number;
  impressions:     number;
  likes:           number;
}

export function buildPerformanceFeedbackSection(
  topPosts:    PerformerSnapshot[],
  bottomPosts: PerformerSnapshot[],
): string {
  if (topPosts.length === 0 && bottomPosts.length === 0) return '';

  const formatPost = (p: PerformerSnapshot, rank: number) =>
    `  ${rank}. Hook: "${p.hook.slice(0, 120)}"\n` +
    `     Topic: ${p.topic ?? 'n/a'} | Eng. rate: ${p.engagement_rate.toFixed(2)}% | Impressions: ${p.impressions.toLocaleString()} | Likes: ${p.likes}`;

  const lines: string[] = ['\nPERFORMANCE INTELLIGENCE — real data from this account\'s published posts:'];

  if (topPosts.length > 0) {
    lines.push('\nTop-performing posts (highest engagement — replicate these patterns):');
    topPosts.forEach((p, i) => lines.push(formatPost(p, i + 1)));
  }

  if (bottomPosts.length > 0) {
    lines.push('\nUnder-performing posts (lowest engagement — avoid these patterns):');
    bottomPosts.forEach((p, i) => lines.push(formatPost(p, i + 1)));
  }

  lines.push('\nUse this data to write content that resembles the top-performers in hook angle, structure, and tone while avoiding the patterns from the under-performers.');
  return lines.join('\n');
}

// ── Content generator prompts ─────────────────────────────────

export interface ContentInputs {
  platform:            string;
  content_type:        string;
  audience_segment:    string;
  topic:               string;
  notes?:              string;
  strategy_context?:   string;
  hashtag_set?:        string[];
  performance_context?: string;
}

export function buildContentUserPrompt(inputs: ContentInputs): string {
  const guide     = PLATFORM_GUIDELINES[inputs.platform] ?? PLATFORM_GUIDELINES.other;
  const hashHint  = inputs.hashtag_set?.length
    ? `\nBase hashtag set to pull from: ${inputs.hashtag_set.join(', ')}`
    : '';
  const ctx       = inputs.strategy_context
    ? `\nStrategy context: ${inputs.strategy_context}`
    : '';
  const perfCtx   = inputs.performance_context ?? '';

  return `Write a ${inputs.platform} ${inputs.content_type} for EPR Compass.

Platform guidelines: ${guide}
Target Audience: ${inputs.audience_segment}
Topic / Theme: ${inputs.topic}
Additional notes: ${inputs.notes || 'None'}${ctx}${hashHint}${perfCtx}

Return a single JSON object:
{
  "hook": "Compelling opening line — the first thing readers see. Must stop the scroll.",
  "body": "Full post body. Follow platform length guidelines exactly.",
  "cta": "Single, clear call-to-action.",
  "hashtags": ["tag1", "tag2", ...],
  "image_brief": "1–2 sentence visual brief for the design team (describe the image/graphic concept — no AI image generation).",
  "variants": [
    {
      "label": "Variant A — [brief description of angle]",
      "hook": "...",
      "body": "...",
      "cta": "...",
      "hashtags": [...]
    },
    {
      "label": "Variant B — [brief description of angle]",
      "hook": "...",
      "body": "...",
      "cta": "...",
      "hashtags": [...]
    }
  ]
}`;
}

// Fallback brand voice when DB lookup fails (ensures AI calls never crash)
export const FALLBACK_BRAND_VOICE: BrandVoiceData = {
  tone_descriptors:  ['authoritative', 'educational', 'compliance-first', 'trustworthy'],
  content_pillars:   ['EPR Compliance', 'Regulatory Updates', 'Sustainability Leadership'],
  trust_anchors:     ['CPCB registered EPR consultant', 'IIM Bangalore partnership'],
  epr_terminology:   {
    EPR:  'Extended Producer Responsibility',
    CPCB: 'Central Pollution Control Board',
    PRO:  'Producer Responsibility Organisation',
  },
  guardrail_list:    ['100% eco-friendly', 'zero waste', 'carbon neutral', 'saves the planet'],
  hashtag_sets:      {
    linkedin:  ['#EPR', '#CPCBCompliance', '#SustainableBusiness', '#EPRCompass'],
    instagram: ['#EPR', '#Sustainability', '#EPRCompass', '#GreenBusiness'],
    twitter:   ['#EPR', '#CPCB', '#EPRCompass'],
    facebook:  ['#EPR', '#SustainableBusiness', '#EPRCompass'],
  },
};

