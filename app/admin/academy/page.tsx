import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function AcademyPage() {
  const supabase = await createServerComponentClient();

  const [{ count: programCount }, { count: sessionCount }, { count: registrationCount }, { count: offeringsCount }] = await Promise.all([
    (supabase as any).from('training_programs').select('id', { count: 'exact', head: true }),
    (supabase as any).from('training_sessions').select('id', { count: 'exact', head: true }),
    (supabase as any).from('training_registrations').select('id', { count: 'exact', head: true }),
    (supabase as any).from('trainer_offerings').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Academy</h1>
        <p className="mt-1 text-slate-400">
          Manage training programs, upcoming sessions, and participant registrations.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Programs</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{Number(programCount || 0)}</p>
          <Link href="/admin/academy/programs" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:underline">
            Open Programs
          </Link>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Sessions</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{Number(sessionCount || 0)}</p>
          <Link href="/admin/academy/sessions" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:underline">
            Open Sessions
          </Link>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-500">Registrations</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{Number(registrationCount || 0)}</p>
          <Link href="/admin/academy/registrations" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:underline">
            Open Registrations
          </Link>
        </article>

        <article className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-5">
          <p className="text-sm text-emerald-600">Trainer Offerings</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{Number(offeringsCount || 0)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active approved services</p>
          <Link href="/admin/academy/trainer-offerings" className="mt-4 inline-flex text-sm font-semibold text-emerald-400 hover:underline">
            View Offerings →
          </Link>
        </article>
      </section>
    </div>
  );
}
