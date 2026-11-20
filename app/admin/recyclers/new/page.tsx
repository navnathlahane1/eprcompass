'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { INDIA_STATES_UTS, COUNTRIES } from '@/lib/indiaGeo';

const STEPS = ['Basic Info', 'Capacity & CPCB', 'Documents'];
const WASTE_OPTIONS = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'];
const DOC_TYPES = ['CPCB Cert', 'GST', 'Bank Details', 'Agreement', 'Capacity Report', 'Other'];

function safeSegment(value: string) {
  return String(value || '').replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default function AddRecyclerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    gstin: '',
    country: 'India',
    state: '',
    city: '',
    address: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    waste_categories: [] as string[],
    capacity_mt_pa: 0,
    cpcb_cert_no: '',
    cpcb_cert_expiry: '',
    status: 'Prospect',
    onboarding_stage: 'Lead'
  });

  const [docs, setDocs] = useState<Array<{ doc_type: string; expiry_date: string; file: File | null }>>([
    { doc_type: 'CPCB Cert', expiry_date: '', file: null }
  ]);

  const canGoNext = useMemo(() => {
    if (step === 1) return Boolean(form.company_name) && form.waste_categories.length > 0;
    if (step === 2) return Number(form.capacity_mt_pa) >= 0;
    return true;
  }, [step, form]);

  function toggleWasteCategory(value: string) {
    setForm((prev) => {
      const exists = prev.waste_categories.includes(value);
      return {
        ...prev,
        waste_categories: exists
          ? prev.waste_categories.filter((item) => item !== value)
          : [...prev.waste_categories, value]
      };
    });
  }

  function addDocRow() {
    setDocs((prev) => [...prev, { doc_type: 'Other', expiry_date: '', file: null }]);
  }

  function updateDoc(index: number, patch: Partial<{ doc_type: string; expiry_date: string; file: File | null }>) {
    setDocs((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  }

  function removeDoc(index: number) {
    setDocs((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function submitFinal() {
    setSaving(true);
    try {
      // Insert recycler via service-role API to bypass RLS
      const insertRes = await fetch('/api/admin/recyclers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capacity_mt_pa: Number(form.capacity_mt_pa || 0)
        })
      });
      const insertJson = await insertRes.json();
      if (!insertRes.ok) throw new Error(insertJson.error || 'Failed to create recycler');

      const recyclerId = insertJson.id;
      const thisMonth = new Date();
      const monthStart = new Date(Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth(), 1));

      await (supabase as any).from('recycler_capacity_log').insert({
        recycler_id: recyclerId,
        month: monthStart.toISOString().slice(0, 10),
        capacity_mt: Number(form.capacity_mt_pa || 0) / 12,
        utilized_mt: 0
      });

      for (const row of docs) {
        if (!row.file) continue;

        const fileName = `${Date.now()}-${safeSegment(row.file.name)}`;
        const docType = safeSegment(row.doc_type);
        const path = `${recyclerId}/${docType}/${fileName}`;

        const { error: uploadError } = await (supabase as any)
          .storage
          .from('recycler-docs')
          .upload(path, row.file, {
            upsert: false,
            contentType: row.file.type || 'application/octet-stream'
          });

        if (uploadError) throw uploadError;

        const { error: docError } = await (supabase as any)
          .from('recycler_documents')
          .insert({
            recycler_id: recyclerId,
            doc_type: row.doc_type,
            file_path: path,
            expiry_date: row.expiry_date || null,
            status: 'Pending'
          });

        if (docError) throw docError;
      }

      router.push(`/admin/recyclers/${recyclerId}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Add Recycler</h1>
        <p className="mt-1 text-sm text-slate-400">Complete all 3 steps and submit.</p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((label, idx) => {
            const current = idx + 1;
            const active = step === current;
            const done = step > current;
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? 'bg-emerald-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {current}
                </span>
                <span className={`text-sm ${active ? 'font-semibold text-slate-100' : 'text-slate-400'}`}>{label}</span>
                {current < STEPS.length ? <span className="mx-1 text-slate-500">→</span> : null}
              </div>
            );
          })}
        </div>
      </section>

      {step === 1 ? (
        <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-2">
          <input value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} placeholder="Company Name" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input value={form.gstin} onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))} placeholder="GSTIN" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          {/* Country selector */}
          <select
            value={form.country}
            onChange={(e) => setForm((p) => ({ ...p, country: e.target.value, state: '' }))}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* State: dropdown for India, free text otherwise */}
          {form.country === 'India' ? (
            <select
              value={form.state}
              onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              <option value="">Select State / UT</option>
              {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} placeholder="State / Province" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          )}
          <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input value={form.contact_person} onChange={(e) => setForm((p) => ({ ...p, contact_person: e.target.value }))} placeholder="Contact Person" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="Website" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address" className="sm:col-span-2 min-h-24 rounded-md border border-slate-700 px-3 py-2 text-sm" />

          <div className="sm:col-span-2 rounded-md border border-slate-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Waste Categories</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {WASTE_OPTIONS.map((item) => (
                <label key={item} className="inline-flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.waste_categories.includes(item)}
                    onChange={() => toggleWasteCategory(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-2">
          <input
            type="number"
            min={0}
            value={form.capacity_mt_pa}
            onChange={(e) => setForm((p) => ({ ...p, capacity_mt_pa: Number(e.target.value || 0) }))}
            placeholder="Annual Capacity (MT)"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          />
          <input
            value={form.cpcb_cert_no}
            onChange={(e) => setForm((p) => ({ ...p, cpcb_cert_no: e.target.value }))}
            placeholder="CPCB Certificate No"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          />
          <label className="text-sm text-slate-200">
            CPCB Certificate Expiry
            <input
              type="date"
              value={form.cpcb_cert_expiry}
              onChange={(e) => setForm((p) => ({ ...p, cpcb_cert_expiry: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm text-slate-200">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              {['Prospect', 'Onboarding', 'Active', 'Suspended', 'Blacklisted'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-200 sm:col-span-2">
            Onboarding Stage
            <select
              value={form.onboarding_stage}
              onChange={(e) => setForm((p) => ({ ...p, onboarding_stage: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              {['Lead', 'Docs Requested', 'Docs Received', 'Verification', 'Agreement Sent', 'Active'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          {docs.map((row, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 p-3 sm:grid-cols-4">
              <select
                value={row.doc_type}
                onChange={(e) => updateDoc(index, { doc_type: e.target.value })}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              >
                {DOC_TYPES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <input
                type="date"
                value={row.expiry_date}
                onChange={(e) => updateDoc(index, { expiry_date: e.target.value })}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              />

              <input
                type="file"
                onChange={(e) => updateDoc(index, { file: e.target.files?.[0] || null })}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={() => removeDoc(index)}
                className="rounded-md border border-rose-700/50 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-950/30"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addDocRow}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950"
          >
            Add Another Document
          </button>
        </section>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || saving}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950 disabled:opacity-60"
        >
          Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            disabled={!canGoNext || saving}
            className="btn-primary"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={submitFinal}
            disabled={saving}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create Recycler'}
          </button>
        )}
      </div>
    </div>
  );
}
