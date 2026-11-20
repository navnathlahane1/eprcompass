import { NextRequest, NextResponse } from 'next/server';
import { resolveExtensionActor } from '@/lib/autofill/extensionAuth';
import { adminClient } from '@/lib/recyclerNetwork/networkAuth';

/**
 * POST /api/autofill/detect
 * Chrome Extension calls this to identify which portal is open.
 * Body: { url: string }
 * Auth: Bearer <extension_token>
 */
export async function POST(req: NextRequest) {
  const actor = await resolveExtensionActor(req.headers.get('authorization'));
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  let parsedHostname = '';
  try {
    parsedHostname = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const db = adminClient();

  // Fetch all active detection rules ordered by priority
  const { data: rules, error } = await (db as any)
    .from('portal_detection_rules')
    .select('*, compliance_portals(*)')
    .eq('is_active', true)
    .order('priority', { ascending: true }); // lower number = higher priority

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let matched: { rule: Record<string, unknown>; portal: Record<string, unknown>; page_context: string | null } | null = null;

  for (const rule of (rules || [])) {
    const pattern: string = rule.match_pattern;
    let isMatch = false;

    switch (rule.match_type) {
      case 'hostname':
        isMatch = parsedHostname === pattern || parsedHostname.endsWith('.' + pattern);
        break;
      case 'url_prefix':
        isMatch = url.startsWith(pattern);
        break;
      case 'url_contains':
        isMatch = url.includes(pattern);
        break;
      case 'url_regex':
        try { isMatch = new RegExp(pattern).test(url); } catch { isMatch = false; }
        break;
    }

    if (isMatch) {
      matched = {
        rule,
        portal: rule.compliance_portals,
        page_context: rule.page_context ?? null,
      };
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ detected: false, portal: null, page_context: null, matched_rule: null });
  }

  return NextResponse.json({
    detected: true,
    portal: matched.portal,
    page_context: matched.page_context,
    matched_rule: matched.rule,
  });
}
