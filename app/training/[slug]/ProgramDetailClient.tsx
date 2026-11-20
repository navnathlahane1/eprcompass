'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function fmtTime(value: string) {
  return value?.slice(0, 5) || '--:--';
}

export default function ProgramDetailClient({
  program,
  initialSessions,
  initialSelectedSession
}: {
  program: any;
  initialSessions: any[];
  initialSelectedSession: string | null;
}) {
  const [sessions, setSessions] = useState(initialSessions || []);
  const [selectedSession, setSelectedSession] = useState<string | null>(
    initialSelectedSession || initialSessions?.[0]?.id || null
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    gstin: ''
  });

  const selectedSessionMeta = useMemo(
    () => sessions.find((s) => s.id === selectedSession) || null,
    [sessions, selectedSession]
  );

  async function submitRegistration(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedSession) {
      setError('Please select a session to register.');
      return;
    }

    setSaving(true);

    try {
      const { data: registrationId, error: rpcError } = await (supabase as any).rpc('register_training_session', {
        p_session_id: selectedSession,
        p_name: form.name,
        p_email: form.email,
        p_phone: form.phone || null,
        p_company: form.company || null,
        p_gstin: form.gstin || null,
        p_profile_id: null
      });

      if (rpcError) throw rpcError;

      if (selectedSessionMeta) {
        setSessions((prev) =>
          prev.map((row) =>
            row.id === selectedSession
              ? { ...row, seats_booked: Number(row.seats_booked || 0) + 1 }
              : row
          )
        );
      }

      await fetch('/api/training/registration-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId })
      });

      setForm({ name: '', email: '', phone: '', company: '', gstin: '' });
      setMessage('Registration received. Confirmation email has been triggered.');
    } catch (err: any) {
      setError(err?.message || 'Could not complete registration.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{program.category} | {program.tier}</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">{program.title}</h1>
        <p className="mt-2 text-sm text-gray-700">{program.description || 'Program details will be shared during onboarding.'}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-700">
          <span>Delivery: <strong>{program.delivery}</strong></span>
          <span>Duration: <strong>{program.duration_hours} hours</strong></span>
          <span>Fee: <strong>{formatINR(Number(program.fee_inr || 0))}</strong></span>
          <span>Trainer: <strong>{program.trainer_name || '-'}</strong></span>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Objectives</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {(program.objectives || []).map((item: string, idx: number) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
          {(program.objectives || []).length === 0 ? <li>Objectives will be announced shortly.</li> : null}
        </ul>
        {program.trainer_bio ? <p className="mt-4 text-sm text-gray-700"><strong>Trainer Bio:</strong> {program.trainer_bio}</p> : null}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>

        <div className="mt-3 hidden overflow-x-auto sm:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Platform</th>
                <th className="py-2 pr-3">Seats Left</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((row) => {
                const seatsLeft = Math.max(0, Number(row.seats_total || 0) - Number(row.seats_booked || 0));
                return (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3 text-gray-700">{row.session_date}</td>
                    <td className="py-2 pr-3 text-gray-700">{fmtTime(row.start_time)} - {fmtTime(row.end_time)}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.platform}</td>
                    <td className="py-2 pr-3 text-gray-700">{seatsLeft}</td>
                    <td className="py-2">
                      <button type="button" onClick={() => setSelectedSession(row.id)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${selectedSession === row.id ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                        Register
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-2 sm:hidden">
          {sessions.map((row) => {
            const seatsLeft = Math.max(0, Number(row.seats_total || 0) - Number(row.seats_booked || 0));
            return (
              <article key={row.id} className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-gray-900">{row.session_date}</p>
                <p className="text-xs text-gray-600">{fmtTime(row.start_time)} - {fmtTime(row.end_time)} | {row.platform}</p>
                <p className="text-xs text-gray-600">Seats Left: {seatsLeft}</p>
                <button type="button" onClick={() => setSelectedSession(row.id)} className={`mt-2 rounded-md px-3 py-1.5 text-xs font-semibold ${selectedSession === row.id ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  Register
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section id="register" className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Registration Form</h2>
        <p className="mt-1 text-sm text-gray-600">Fill your details to reserve your seat. Payment status starts as Pending.</p>

        <form onSubmit={submitRegistration} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Session</label>
            <select value={selectedSession || ''} onChange={(e) => setSelectedSession(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required>
              {(sessions || []).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.session_date} | {fmtTime(row.start_time)} - {fmtTime(row.end_time)} | {row.platform}
                </option>
              ))}
            </select>
          </div>

          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.gstin} onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))} placeholder="GSTIN (optional)" className="rounded-md border border-gray-300 px-3 py-2 text-sm md:col-span-2" />

          <button disabled={saving || sessions.length === 0} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
