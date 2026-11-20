/**
 * GET /api/academy/partner-dashboard
 * Returns partner trainer dashboard data from the database.
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const TIER_LABELS: Record<number, string> = {
  1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Platinum', 5: 'Platinum',
};

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date().toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().slice(0, 10);

  // ── Partner record (may not exist for all partner_trainer profiles) ──────────
  const { data: partner } = await db
    .from('partners')
    .select('id, partner_tier, partner_status, training_completed, nda_signed, agreement_signed')
    .eq('profile_id', actor.id)
    .maybeSingle() as any;

  // ── Sessions where this user is the trainer ──────────────────────────────────
  const { data: sessionRows } = await db
    .from('academy_sessions')
    .select('id, title, program_id, scheduled_date, registered_count, seats_total, status')
    .eq('trainer_id', actor.id)
    .order('scheduled_date') as any;

  const sessions = sessionRows ?? [];

  // Resolve program titles for sessions
  const progIds = [...new Set(sessions.map((s: any) => s.program_id).filter(Boolean))] as string[];
  const { data: progRows } = progIds.length
    ? await db.from('academy_programs').select('id, title').in('id', progIds) as any
    : { data: [] };
  const ptMap: Record<string, string> = {};
  for (const p of progRows ?? []) ptMap[p.id] = p.title;

  // ── Earnings (only if a partners record exists) ──────────────────────────────
  let earningsThisMonth = 0;
  let earningsTotal     = 0;
  let pendingPayout     = 0;
  let referralCount     = 0;
  let programs: string[] = [];

  if (partner) {
    const { data: earningsRows } = await db
      .from('partner_earnings')
      .select('commission_inr, payment_status, period_month')
      .eq('partner_id', partner.id) as any;

    for (const e of earningsRows ?? []) {
      const amt = Number(e.commission_inr) || 0;
      earningsTotal += amt;
      if (String(e.period_month ?? '').slice(0, 7) >= monthStart.slice(0, 7)) {
        earningsThisMonth += amt;
      }
      if (e.payment_status === 'Pending') pendingPayout += amt;
    }

    // Programs from sessions this partner delivers
    programs = [...new Set(
      sessions
        .map((s: any) => ptMap[s.program_id])
        .filter(Boolean)
    )] as string[];
  }

  // ── Active batch: next upcoming session ──────────────────────────────────────
  const upcoming = sessions.filter((s: any) => s.scheduled_date >= now);
  const batchSession = upcoming[0] ?? null;
  const activeBatch = batchSession
    ? {
        name:     ptMap[batchSession.program_id] ?? batchSession.title ?? 'Upcoming Session',
        date:     batchSession.scheduled_date ?? '',
        enrolled: Number(batchSession.registered_count) || 0,
        target:   Number(batchSession.seats_total) || 0,
      }
    : null;

  // ── Tier / partner identity ──────────────────────────────────────────────────
  const tierNum = partner?.partner_tier ? Number(partner.partner_tier) : null;
  const tier    = tierNum ? (TIER_LABELS[tierNum] ?? 'Bronze') : null;
  const tierChar = tier ? tier.charAt(0) : 'P';
  const shortId  = partner?.id ? partner.id.replace(/-/g, '').slice(0, 3).toUpperCase() : '000';
  const partnerId = partner ? `ECV-${tierChar}-${shortId}` : null;

  // ── T3 certification ─────────────────────────────────────────────────────────
  const t3Status = partner?.training_completed ? 'Certified' : 'In Progress';

  // ── Onboarding steps derived from partner fields ──────────────────────────────
  const hasSessions = sessions.length > 0;
  const hasDelivered = sessions.some(
    (s: any) => s.scheduled_date < now && ['Completed', 'completed'].includes(s.status ?? '')
  );

  const onboardingSteps = [
    { label: 'LOI Signed',              done: partner?.nda_signed ?? false         },
    { label: 'T3 Day 1 Completed',      done: partner?.training_completed ?? false  },
    { label: 'T3 Day 2 Completed',      done: partner?.training_completed ?? false  },
    { label: 'T3 Day 3 & Certified',    done: partner?.training_completed ?? false  },
    { label: 'LMS Access Activated',    done: !!actor.id                            },
    { label: 'Referral Link Activated', done: !!partner?.id                         },
    { label: 'Full Partner MoU Signed', done: partner?.agreement_signed ?? false    },
    { label: 'First Batch Delivered',   done: hasDelivered                          },
  ];

  return NextResponse.json({
    tier,
    partnerId,
    t3Status,
    t3Issued:          null,
    t3Expiry:          null,
    referralLink:      null,
    referralCount,
    activeBatch,
    earningsThisMonth,
    earningsTotal,
    pendingPayout,
    programs,
    onboardingSteps,
  });
}
