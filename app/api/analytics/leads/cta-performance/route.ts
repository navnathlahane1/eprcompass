import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

type SubmissionRow = {
  created_at: string;
  submission_data: {
    event_type?: string;
    intent?: string;
    cta?: string;
    cta_variant?: string;
    industry?: string;
    [key: string]: unknown;
  } | null;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizeIntent(value: unknown) {
  const normalized = String(value || 'general').trim().toLowerCase();
  return normalized || 'general';
}

function normalizeVariant(value: unknown) {
  const normalized = String(value || 'a').trim().toLowerCase();
  return normalized === 'b' ? 'b' : 'a';
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

export async function GET() {
  try {
    const { deny } = await requireAdminSession();
    if (deny) return deny;

    const db = adminClient() as any;
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const { data, error } = await db
      .from('form_submissions')
      .select('created_at, submission_data')
      .eq('module_key', 'contact_form')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(3000);

    if (error) {
      throw new Error(error.message || 'Unable to fetch CTA submission data');
    }

    const rows: SubmissionRow[] = Array.isArray(data) ? data : [];
    const clickRows = rows.filter((row) => {
      const payload = row.submission_data || {};
      return payload.event_type === 'industry_cta_click' && Boolean(payload.intent);
    });
    const submitRows = rows.filter((row) => {
      const payload = row.submission_data || {};
      return payload.event_type !== 'industry_cta_click' && Boolean(payload.intent);
    });

    const summaryByIntentVariant: Record<string, {
      intent: string;
      ctaVariant: string;
      clicks: number;
      submissions: number;
    }> = {};
    const totalsByVariant: Record<string, number> = { a: 0, b: 0 };
    const clickTotalsByVariant: Record<string, number> = { a: 0, b: 0 };
    const submissionTotalsByVariant: Record<string, number> = { a: 0, b: 0 };
    const totalsByIntent: Record<string, number> = {};

    const monthlyMap: Record<string, { month: string; aClicks: number; bClicks: number; aSubmissions: number; bSubmissions: number }> = {};

    clickRows.forEach((row) => {
      const payload = row.submission_data || {};
      const intent = normalizeIntent(payload.intent);
      const ctaVariant = normalizeVariant(payload.cta_variant || payload.cta);
      const key = `${intent}__${ctaVariant}`;

      if (!summaryByIntentVariant[key]) {
        summaryByIntentVariant[key] = { intent, ctaVariant, clicks: 0, submissions: 0 };
      }
      summaryByIntentVariant[key].clicks += 1;
      clickTotalsByVariant[ctaVariant] = (clickTotalsByVariant[ctaVariant] || 0) + 1;

      const month = monthLabel(row.created_at);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, aClicks: 0, bClicks: 0, aSubmissions: 0, bSubmissions: 0 };
      }
      if (ctaVariant === 'b') {
        monthlyMap[month].bClicks += 1;
      } else {
        monthlyMap[month].aClicks += 1;
      }
    });

    submitRows.forEach((row) => {
      const payload = row.submission_data || {};
      const intent = normalizeIntent(payload.intent);
      const ctaVariant = normalizeVariant(payload.cta_variant || payload.cta);
      const key = `${intent}__${ctaVariant}`;

      if (!summaryByIntentVariant[key]) {
        summaryByIntentVariant[key] = { intent, ctaVariant, clicks: 0, submissions: 0 };
      }
      summaryByIntentVariant[key].submissions += 1;
      submissionTotalsByVariant[ctaVariant] = (submissionTotalsByVariant[ctaVariant] || 0) + 1;
      totalsByVariant[ctaVariant] = (totalsByVariant[ctaVariant] || 0) + 1;
      totalsByIntent[intent] = (totalsByIntent[intent] || 0) + 1;

      const month = monthLabel(row.created_at);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, aClicks: 0, bClicks: 0, aSubmissions: 0, bSubmissions: 0 };
      }
      if (ctaVariant === 'b') {
        monthlyMap[month].bSubmissions += 1;
      } else {
        monthlyMap[month].aSubmissions += 1;
      }
    });

    const intentVariantRows = Object.values(summaryByIntentVariant)
      .sort((x, y) => y.submissions - x.submissions)
      .map((item) => {
        const intentTotal = totalsByIntent[item.intent] || 1;
        const conversionRate = item.clicks > 0
          ? Math.round((item.submissions / item.clicks) * 100)
          : 0;
        return {
          ...item,
          shareWithinIntent: Math.round((item.submissions / intentTotal) * 100),
          conversionRate,
        };
      });

    const totalClicks = clickTotalsByVariant.a + clickTotalsByVariant.b;
    const totalSubmissions = submissionTotalsByVariant.a + submissionTotalsByVariant.b;
    const conversionShareByVariant = {
      a: submissionTotalsByVariant.a,
      b: submissionTotalsByVariant.b,
      total: totalSubmissions,
      clicksA: clickTotalsByVariant.a,
      clicksB: clickTotalsByVariant.b,
      clicksTotal: totalClicks,
      aShare: totalSubmissions > 0
        ? Math.round((submissionTotalsByVariant.a / totalSubmissions) * 100)
        : 0,
      bShare: totalSubmissions > 0
        ? Math.round((submissionTotalsByVariant.b / totalSubmissions) * 100)
        : 0,
      overallConversionRate: totalClicks > 0
        ? Math.round((totalSubmissions / totalClicks) * 100)
        : 0,
      conversionRateA: clickTotalsByVariant.a > 0
        ? Math.round((submissionTotalsByVariant.a / clickTotalsByVariant.a) * 100)
        : 0,
      conversionRateB: clickTotalsByVariant.b > 0
        ? Math.round((submissionTotalsByVariant.b / clickTotalsByVariant.b) * 100)
        : 0,
    };

    const monthly = Object.values(monthlyMap);

    return NextResponse.json({
      windowDays: 90,
      totalsByIntent,
      conversionShareByVariant,
      intentVariantRows,
      monthly,
    });
  } catch (err) {
    console.error('[analytics/cta-performance]', err);
    return NextResponse.json({ error: 'Failed to load CTA performance' }, { status: 500 });
  }
}
