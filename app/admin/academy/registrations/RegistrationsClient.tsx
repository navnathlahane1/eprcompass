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

export default function RegistrationsClient({ initialRows, sessionOptions }: { initialRows: any[]; sessionOptions: any[] }) {
  const [rows, setRows] = useState(initialRows || []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({ sessionId: 'All', paymentStatus: 'All' });
  const [certBaseUrl, setCertBaseUrl] = useState('https://certificates.example.com');

  const filtered = useMemo(() => {
    return (rows || []).filter((row) => {
      const sessionOk = filters.sessionId === 'All' || row.session_id === filters.sessionId;
      const paymentOk = filters.paymentStatus === 'All' || row.payment_status === filters.paymentStatus;
      return sessionOk && paymentOk;
    });
  }, [rows, filters]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const paid = filtered.filter((row) => row.payment_status === 'Paid').length;
    const revenue = filtered
      .filter((row) => row.payment_status === 'Paid')
      .reduce((sum, row) => sum + Number(row.amount_paid_inr || 0), 0);
    const attended = filtered.filter((row) => row.attended).length;
    const attendanceRate = total > 0 ? (attended / total) * 100 : 0;
    return { total, paid, revenue, attendanceRate };
  }, [filtered]);

  async function bulkMarkAttended() {
    if (!selectedIds.length) return;

    const { error } = await (supabase as any)
      .from('registrations')
      .update({ attended: true })
      .in('id', selectedIds);

    if (error) return;

    setRows((prev) => prev.map((row) => (selectedIds.includes(row.id) ? { ...row, attended: true } : row)));
    setSelectedIds([]);
  }

  async function bulkIssueCertificate() {
    if (!selectedIds.length) return;

    const patchRows = selectedIds.map((id) => ({
      id,
      certificate_issued: true,
      certificate_url: `${certBaseUrl.replace(/\/$/, '')}/${id}`
    }));

    for (const patchRow of patchRows) {
      const { error } = await (supabase as any)
        .from('registrations')
        .update({ certificate_issued: true, certificate_url: patchRow.certificate_url })
        .eq('id', patchRow.id);
      if (error) return;
    }

    setRows((prev) =>
      prev.map((row) => {
        const found = patchRows.find((item) => item.id === row.id);
        return found ? { ...row, certificate_issued: true, certificate_url: found.certificate_url } : row;
      })
    );
    setSelectedIds([]);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Academy Registrations</h1>
        <p className="mt-1 text-sm text-slate-400">Track enrollment, payments, attendance, and certificates.</p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">Total Registered</p><p className="mt-2 text-2xl font-semibold text-slate-100">{kpis.total}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">Paid</p><p className="mt-2 text-2xl font-semibold text-slate-100">{kpis.paid}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">Revenue</p><p className="mt-2 text-2xl font-semibold text-slate-100">{formatINR(kpis.revenue)}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">Attendance Rate</p><p className="mt-2 text-2xl font-semibold text-slate-100">{kpis.attendanceRate.toFixed(1)}%</p></article>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-3">
        <select value={filters.sessionId} onChange={(e) => setFilters((p) => ({ ...p, sessionId: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
          <option value="All">Session: All</option>
          {(sessionOptions || []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.training_programs?.title || 'Program'} | {item.session_date} | {item.start_time?.slice(0, 5)}
            </option>
          ))}
        </select>

        <select value={filters.paymentStatus} onChange={(e) => setFilters((p) => ({ ...p, paymentStatus: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
          <option value="All">Payment: All</option>
          {['Pending', 'Paid', 'Waived', 'Refunded'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <input value={certBaseUrl} onChange={(e) => setCertBaseUrl(e.target.value)} placeholder="Certificate base URL" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
      </section>

      <div className="flex flex-wrap gap-2">
        <button onClick={bulkMarkAttended} disabled={selectedIds.length === 0} className="btn-primary">Mark Attended</button>
        <button onClick={bulkIssueCertificate} disabled={selectedIds.length === 0} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">Issue Certificate</button>
      </div>

      <section className="hidden overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Attended</th>
              <th className="px-4 py-3">Certificate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const checked = selectedIds.includes(row.id);
              return (
                <tr key={row.id} className="border-b border-slate-800/60">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedIds((prev) =>
                          e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                        );
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-100">{row.name}</td>
                  <td className="px-4 py-3 text-slate-200">{row.email}</td>
                  <td className="px-4 py-3 text-slate-200">{row.company || '-'}</td>
                  <td className="px-4 py-3 text-slate-200">{row.training_sessions?.training_programs?.title || 'Program'} | {row.training_sessions?.session_date}</td>
                  <td className="px-4 py-3 text-slate-200">{row.payment_status === 'Paid' ? `Yes (${formatINR(row.amount_paid_inr)})` : row.payment_status}</td>
                  <td className="px-4 py-3 text-slate-200">{row.attended ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-slate-200">{row.certificate_issued ? 'Issued' : 'Pending'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-2 sm:hidden">
        {filtered.map((row) => {
          const checked = selectedIds.includes(row.id);
          return (
            <article key={row.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{row.name}</p>
                  <p className="text-xs text-slate-400">{row.email}</p>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setSelectedIds((prev) =>
                      e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                    );
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Company: {row.company || '-'}</p>
              <p className="text-xs text-slate-400">Session: {row.training_sessions?.training_programs?.title || 'Program'} | {row.training_sessions?.session_date}</p>
              <p className="text-xs text-slate-400">Paid: {row.payment_status === 'Paid' ? `Yes (${formatINR(row.amount_paid_inr)})` : row.payment_status}</p>
              <p className="text-xs text-slate-400">Attended: {row.attended ? 'Yes' : 'No'}</p>
              <p className="text-xs text-slate-400">Certificate: {row.certificate_issued ? 'Issued' : 'Pending'}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
