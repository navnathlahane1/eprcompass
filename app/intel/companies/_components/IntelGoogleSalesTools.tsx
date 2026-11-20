'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function IntelGoogleSalesTools({ companyId }: { companyId: string }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [websites, setWebsites] = useState<{ title: string; link: string }[]>([]);
  const [docs, setDocs] = useState<{ title: string; link: string; kind?: string }[]>([]);
  const [legs, setLegs] = useState<{ company_name: string; distance_km: number | null; duration_min: number | null; company_id: string }[]>([]);

  async function token() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not signed in');
    return session.access_token;
  }

  async function webSearch() {
    setBusy('search');
    setMsg('');
    try {
      const res = await fetch('/api/intel/enrich/web-search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Search failed');
      setWebsites(body.websites || []);
      setDocs(body.documents || []);
      setMsg(body.website ? `Website set to ${body.website}` : `Saved ${body.documents?.length || 0} document links`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setBusy('');
    }
  }

  async function drive() {
    setBusy('drive');
    setMsg('');
    try {
      const res = await fetch(`/api/intel/enrich/drive-times?company_id=${encodeURIComponent(companyId)}`, {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Drive times failed');
      setLegs(body.legs || []);
      setMsg(`Ranked ${body.legs?.length || 0} plants by drive time`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Drive times failed');
    } finally {
      setBusy('');
    }
  }

  async function parseDoc(url: string) {
    setBusy('parse');
    setMsg('');
    try {
      const res = await fetch('/api/intel/enrich/parse-document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ source_url: url }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Parse failed');
      if (body.skipped) setMsg(body.hint || 'Document AI not configured');
      else setMsg((body.text || '').slice(0, 400) || 'Parsed');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Parse failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">Google sales enrich</p>
      <p className="mt-1 text-xs text-slate-400">Find official site and CPCB PDFs, then rank nearby recyclers by drive time.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!!busy} onClick={webSearch} className="rounded-lg bg-[#07875f] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          {busy === 'search' ? 'Searching…' : 'Find website & CPCB PDFs'}
        </button>
        <button type="button" disabled={!!busy} onClick={drive} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-200 disabled:opacity-50">
          {busy === 'drive' ? 'Routing…' : 'Nearest recyclers (drive time)'}
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-amber-200">{msg}</p> : null}
      {websites.length ? (
        <ul className="mt-3 space-y-1 text-xs">
          {websites.slice(0, 4).map((w) => (
            <li key={w.link}><a className="text-teal-300 hover:underline" href={w.link} target="_blank" rel="noreferrer">{w.title}</a></li>
          ))}
        </ul>
      ) : null}
      {docs.length ? (
        <ul className="mt-2 space-y-1 text-xs">
          {docs.slice(0, 6).map((d) => (
            <li key={d.link} className="flex flex-wrap items-center gap-2">
              <a className="text-slate-200 hover:underline" href={d.link} target="_blank" rel="noreferrer">{d.title}</a>
              <button type="button" className="text-[10px] font-semibold text-teal-300" onClick={() => parseDoc(d.link)}>Parse PDF</button>
            </li>
          ))}
        </ul>
      ) : null}
      {legs.length ? (
        <table className="mt-3 w-full text-left text-xs">
          <thead><tr className="text-[10px] uppercase text-slate-500"><th>Plant</th><th>Km</th><th>Min</th></tr></thead>
          <tbody>
            {legs.map((l) => (
              <tr key={l.company_id} className="border-t border-slate-800 text-slate-200">
                <td className="py-1 pr-2">{l.company_name}</td>
                <td className="py-1 pr-2 tabular-nums">{l.distance_km ?? '—'}</td>
                <td className="py-1 tabular-nums">{l.duration_min ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
