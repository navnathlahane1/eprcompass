'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ENTITY_ROLES, EPR_STREAMS, type IntelDossier } from '@/lib/intel/dossier';

type Props = { companyId: string; isRecycler: boolean };

const empty: IntelDossier = {
  company: {
    id: '',
    entity_roles: [],
    iec: null,
    udyam: null,
    whatsapp: null,
    phone: null,
    email: null,
    cpcb_portal_id: null,
    job_worker_liable: null,
    marketplace_seller_ids: {},
    parent_company_id: null,
  },
  obligations: [],
  authorizations: [],
  stream_profiles: [],
  pro_agreements: [],
  credit_purchases: [],
  documents: [],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  'w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-teal-400';

export default function IntelEprDossier({ companyId, isRecycler }: Props) {
  const [data, setData] = useState<IntelDossier>(empty);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [fy, setFy] = useState(new Date().getFullYear());
  const [stream, setStream] = useState('plastic');
  const [mt, setMt] = useState('');
  const [cpcbNo, setCpcbNo] = useState('');
  const [authMt, setAuthMt] = useState('');
  const [price, setPrice] = useState('');
  const [proName, setProName] = useState('');
  const [docType, setDocType] = useState('authorization');
  const [docUrl, setDocUrl] = useState('');

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/intel/dossier?company_id=${encodeURIComponent(companyId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      setMsg(body.error || 'Dossier tables may need migration 192.');
      return;
    }
    setData({
      company: {
        ...empty.company,
        ...(body.company || {}),
        marketplace_seller_ids: body.company?.marketplace_seller_ids || {},
      },
      obligations: body.obligations || [],
      authorizations: body.authorizations || [],
      stream_profiles: body.stream_profiles || [],
      pro_agreements: body.pro_agreements || [],
      credit_purchases: body.credit_purchases || [],
      documents: body.documents || [],
    });
    setMsg('');
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function post(payload: Record<string, unknown>) {
    setBusy(true);
    setMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in');
      const res = await fetch('/api/intel/dossier', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, ...payload }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Save failed');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  const c = data.company;
  const roles = new Set(c.entity_roles || []);

  return (
    <section className="rounded-2xl border border-teal-800/40 bg-slate-900/70 p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">EPR dossier</p>
          <h3 className="text-sm font-semibold text-slate-100">
            {isRecycler ? 'Recycler operating data' : 'PIBO obligation data'}
          </h3>
          <p className="mt-1 text-xs text-slate-400">Stream × FY numbers, portal IDs, and documents — not website scrape fields.</p>
        </div>
        {msg ? <p className="text-xs text-amber-200">{msg}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="IEC">
          <input className={inputClass} value={c.iec || ''} onChange={(e) => setData((d) => ({ ...d, company: { ...d.company, iec: e.target.value } }))} />
        </Field>
        <Field label="Udyam">
          <input className={inputClass} value={c.udyam || ''} onChange={(e) => setData((d) => ({ ...d, company: { ...d.company, udyam: e.target.value } }))} />
        </Field>
        <Field label="WhatsApp">
          <input className={inputClass} value={c.whatsapp || ''} onChange={(e) => setData((d) => ({ ...d, company: { ...d.company, whatsapp: e.target.value } }))} />
        </Field>
        <Field label="CPCB portal ID">
          <input className={inputClass} value={c.cpcb_portal_id || ''} onChange={(e) => setData((d) => ({ ...d, company: { ...d.company, cpcb_portal_id: e.target.value } }))} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ENTITY_ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              const next = new Set(roles);
              if (next.has(r.id)) next.delete(r.id);
              else next.add(r.id);
              setData((d) => ({ ...d, company: { ...d.company, entity_roles: [...next] } }));
            }}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              roles.has(r.id) ? 'border-teal-500/60 bg-teal-500/15 text-teal-200' : 'border-slate-700 text-slate-400'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {!isRecycler ? (
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(c.job_worker_liable)}
            onChange={(e) => setData((d) => ({ ...d, company: { ...d.company, job_worker_liable: e.target.checked } }))}
          />
          Job-worker / brand-owner liability applies
        </label>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          post({
            action: 'patch_company',
            patch: {
              entity_roles: c.entity_roles,
              iec: c.iec,
              udyam: c.udyam,
              whatsapp: c.whatsapp,
              cpcb_portal_id: c.cpcb_portal_id,
              job_worker_liable: c.job_worker_liable,
            },
          })
        }
        className="mt-3 rounded-lg bg-[#07875f] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
      >
        Save identity
      </button>

      {!isRecycler ? (
        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-xs font-semibold text-teal-200">Obligations (stream × FY)</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500">
                  <th className="py-1 pr-2">FY</th>
                  <th className="py-1 pr-2">Stream</th>
                  <th className="py-1 pr-2">Category</th>
                  <th className="py-1 pr-2">Target MT</th>
                  <th className="py-1 pr-2">Placed</th>
                  <th className="py-1 pr-2">Credits</th>
                  <th className="py-1 pr-2">Shortfall</th>
                  <th className="py-1 pr-2">Return</th>
                </tr>
              </thead>
              <tbody>
                {data.obligations.map((row) => (
                  <tr key={String(row.id)} className="border-t border-slate-800 text-slate-200">
                    <td className="py-1 pr-2">{String(row.fy)}</td>
                    <td className="py-1 pr-2">{String(row.stream)}</td>
                    <td className="py-1 pr-2">{String(row.category_code || '—')}</td>
                    <td className="py-1 pr-2">{String(row.target_mt ?? '—')}</td>
                    <td className="py-1 pr-2">{String(row.placed_mt ?? '—')}</td>
                    <td className="py-1 pr-2">{String(row.credits_mt ?? '—')}</td>
                    <td className="py-1 pr-2">{String(row.shortfall_mt ?? '—')}</td>
                    <td className="py-1 pr-2">{String(row.return_status || '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <select className={inputClass} value={stream} onChange={(e) => setStream(e.target.value)}>
              {EPR_STREAMS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <input className={inputClass} type="number" value={fy} onChange={(e) => setFy(Number(e.target.value))} />
            <input className={inputClass} placeholder="Target MT" value={mt} onChange={(e) => setMt(e.target.value)} />
            <button
              type="button"
              disabled={busy || !mt}
              onClick={() => post({ kind: 'obligations', row: { stream, fy, target_mt: Number(mt) } })}
              className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-200"
            >
              Add obligation
            </button>
          </div>

          <p className="mt-5 text-xs font-semibold text-teal-200">PRO agreements</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-300">
            {data.pro_agreements.map((a) => (
              <li key={String(a.id)}>{String(a.pro_name)} · {String(a.stream || '—')} · {String(a.assigned_mt ?? '—')} MT</li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input className={inputClass} placeholder="PRO name" value={proName} onChange={(e) => setProName(e.target.value)} />
            <button
              type="button"
              disabled={busy || !proName}
              onClick={() => post({ kind: 'pro_agreements', row: { pro_name: proName, stream } })}
              className="shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-200"
            >
              Add PRO
            </button>
          </div>

          <p className="mt-5 text-xs font-semibold text-teal-200">Credit purchases</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-300">
            {data.credit_purchases.map((p) => (
              <li key={String(p.id)}>{String(p.fy)} · {String(p.stream)} · {String(p.mt)} MT · ₹{String(p.inr ?? '—')}</li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy || !mt}
            onClick={() => post({ kind: 'credit_purchases', row: { stream, fy, mt: Number(mt) } })}
            className="mt-2 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-200"
          >
            Log credit purchase (uses FY / stream / MT above)
          </button>
        </div>
      ) : (
        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-xs font-semibold text-teal-200">Authorizations (plant × stream)</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500">
                  <th className="py-1 pr-2">Stream</th>
                  <th className="py-1 pr-2">CPCB no.</th>
                  <th className="py-1 pr-2">SPCB consent</th>
                  <th className="py-1 pr-2">Valid to</th>
                  <th className="py-1 pr-2">Auth MT</th>
                  <th className="py-1 pr-2">Utilised</th>
                  <th className="py-1 pr-2">Credits avail.</th>
                  <th className="py-1 pr-2">₹/MT</th>
                </tr>
              </thead>
              <tbody>
                {data.authorizations.map((row) => (
                  <tr key={String(row.id)} className="border-t border-slate-800 text-slate-200">
                    <td className="py-1 pr-2">{String(row.stream)}</td>
                    <td className="py-1 pr-2">{String(row.cpcb_registration_no || '—')}</td>
                    <td className="py-1 pr-2">{String(row.spcb_consent_no || '—')}</td>
                    <td className="py-1 pr-2">{String(row.valid_upto || '—')}</td>
                    <td className="py-1 pr-2">{String(row.authorized_mt ?? '—')}</td>
                    <td className="py-1 pr-2">{String(row.utilised_mt ?? '—')}</td>
                    <td className="py-1 pr-2">{String(row.credits_available_mt ?? '—')}</td>
                    <td className="py-1 pr-2">{String(row.asking_inr_per_mt ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <select className={inputClass} value={stream} onChange={(e) => setStream(e.target.value)}>
              {EPR_STREAMS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <input className={inputClass} placeholder="CPCB registration no." value={cpcbNo} onChange={(e) => setCpcbNo(e.target.value)} />
            <input className={inputClass} placeholder="Authorized MT" value={authMt} onChange={(e) => setAuthMt(e.target.value)} />
            <input className={inputClass} placeholder="₹ / MT" value={price} onChange={(e) => setPrice(e.target.value)} />
            <button
              type="button"
              disabled={busy || !cpcbNo}
              onClick={() =>
                post({
                  kind: 'authorizations',
                  row: {
                    stream,
                    cpcb_registration_no: cpcbNo,
                    authorized_mt: authMt ? Number(authMt) : null,
                    asking_inr_per_mt: price ? Number(price) : null,
                    status: 'active',
                  },
                })
              }
              className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-200"
            >
              Add authorization
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-slate-800 pt-4">
        <p className="text-xs font-semibold text-teal-200">Documents</p>
        <ul className="mt-1 space-y-1 text-xs text-slate-300">
          {data.documents.map((d) => (
            <li key={String(d.id)}>
              {String(d.doc_type)} · {String(d.title || d.source_url || '—')}
              {d.valid_upto ? ` · valid ${String(d.valid_upto)}` : ''}
            </li>
          ))}
        </ul>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input className={inputClass} placeholder="Type (authorization, gst, consent)" value={docType} onChange={(e) => setDocType(e.target.value)} />
          <input className={inputClass} placeholder="URL or path" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
          <button
            type="button"
            disabled={busy || !docUrl}
            onClick={() => post({ kind: 'documents', row: { doc_type: docType, source_url: docUrl } })}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-200"
          >
            Add document
          </button>
        </div>
      </div>
    </section>
  );
}
