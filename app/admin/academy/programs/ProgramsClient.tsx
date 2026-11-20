'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const CATEGORY_OPTIONS = ['PWM Rules', 'EPR Portal', 'Plastic Accounting', 'Credit Trading', 'Battery EPR', 'CEPC Bootcamp', 'EALP'];
const TIER_OPTIONS = ['Free', 'Bootcamp', 'CEPC', 'EALP'];
const DELIVERY_OPTIONS = ['Live Webinar', 'Recorded', 'Hybrid'];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function statusBadge(status: string) {
  if (status === 'Published') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Cancelled') return 'bg-rose-900/30 text-rose-300';
  return 'bg-slate-100 text-slate-700';
}

export default function ProgramsClient({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'PWM Rules',
    tier: 'Free',
    delivery: 'Live Webinar',
    duration_hours: 1,
    fee_inr: 0,
    max_seats: 50,
    trainer_name: '',
    trainer_bio: '',
    description: '',
    objectives: '',
    status: 'Draft'
  });

  async function addProgram(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: form.title,
        slug: slugify(form.title),
        category: form.category,
        tier: form.tier,
        delivery: form.delivery,
        duration_hours: Number(form.duration_hours || 0),
        fee_inr: Number(form.fee_inr || 0),
        max_seats: Number(form.max_seats || 0),
        trainer_name: form.trainer_name || null,
        trainer_bio: form.trainer_bio || null,
        description: form.description || null,
        objectives: form.objectives
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        status: form.status
      };

      const { data, error: insertError } = await (supabase as any)
        .from('training_programs')
        .insert(payload)
        .select('id, title, slug, category, tier, delivery, duration_hours, fee_inr, max_seats, trainer_name, trainer_bio, description, objectives, status, created_at')
        .single();

      if (insertError) throw insertError;
      setRows((prev) => [data, ...prev]);
      setForm({
        title: '',
        category: 'PWM Rules',
        tier: 'Free',
        delivery: 'Live Webinar',
        duration_hours: 1,
        fee_inr: 0,
        max_seats: 50,
        trainer_name: '',
        trainer_bio: '',
        description: '',
        objectives: '',
        status: 'Draft'
      });
    } catch (err: any) {
      setError(err?.message || 'Could not add program');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: any) {
    const nextStatus = row.status === 'Published' ? 'Draft' : 'Published';

    const { error: updateError } = await (supabase as any)
      .from('training_programs')
      .update({ status: nextStatus })
      .eq('id', row.id);

    if (updateError) {
      setError(updateError.message || 'Could not update status');
      return;
    }

    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Academy Programs</h1>
        <p className="mt-1 text-sm text-slate-400">Manage training programs and publishing status.</p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Add Program</h2>
        <form onSubmit={addProgram} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Program Title" className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2" />

          <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
            {CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={form.tier} onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
            {TIER_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={form.delivery} onChange={(e) => setForm((p) => ({ ...p, delivery: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
            {DELIVERY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <input type="number" step="0.5" value={form.duration_hours} onChange={(e) => setForm((p) => ({ ...p, duration_hours: Number(e.target.value) }))} placeholder="Duration Hours" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input type="number" value={form.fee_inr} onChange={(e) => setForm((p) => ({ ...p, fee_inr: Number(e.target.value) }))} placeholder="Fee INR" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input type="number" value={form.max_seats} onChange={(e) => setForm((p) => ({ ...p, max_seats: Number(e.target.value) }))} placeholder="Max Seats" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input value={form.trainer_name} onChange={(e) => setForm((p) => ({ ...p, trainer_name: e.target.value }))} placeholder="Trainer Name" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <textarea value={form.trainer_bio} onChange={(e) => setForm((p) => ({ ...p, trainer_bio: e.target.value }))} placeholder="Trainer Bio" className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={form.objectives} onChange={(e) => setForm((p) => ({ ...p, objectives: e.target.value }))} placeholder="Objectives (comma separated)" className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2" />

          <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Add Program'}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-800/60">
                <td className="px-4 py-3 font-medium text-slate-100">{row.title}</td>
                <td className="px-4 py-3 text-slate-200">{row.category}</td>
                <td className="px-4 py-3 text-slate-200">{row.tier}</td>
                <td className="px-4 py-3 text-slate-200">{row.delivery}</td>
                <td className="px-4 py-3 text-slate-200">{Number(row.fee_inr || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>{row.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(row)} className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-950">
                    Toggle Published/Draft
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
