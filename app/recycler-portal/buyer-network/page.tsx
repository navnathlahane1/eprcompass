'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Requirement {
  id: string;
  pibo_name: string;
  pibo_type: string | null;
  waste_category: string;
  required_qty_mt: number;
  target_price_inr: number | null;
  states: string[];
  fulfillment_period: string | null;
  description: string | null;
  expires_at: string | null;
  matchScore: number;
  matched: boolean;
  myInterest: { status: string; offered_qty_mt: number | null } | null;
}

interface MyInterest {
  id: string;
  requirement_id: string;
  offered_qty_mt: number | null;
  offered_price_inr: number | null;
  status: string;
  message: string | null;
  follow_up_at: string | null;
  crm_notes: string | null;
  created_at: string;
  requirement: Requirement | null;
}

const INTEREST_STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  SHORTLISTED: 'bg-blue-100 text-blue-800 border-blue-300',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-300',
  DECLINED: 'bg-gray-100 text-gray-500 border-gray-300',
  WITHDRAWN: 'bg-gray-100 text-gray-500 border-gray-300',
};

const PIPELINE_COLUMNS: { key: string; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'DECLINED', label: 'Declined / Withdrawn' },
];

function fmtINR(n: number | null, masked: boolean) {
  if (masked) return '₹ ••••';
  return n != null ? '₹' + n.toLocaleString('en-IN') : '—';
}

function isOverdue(followUpAt: string | null) {
  if (!followUpAt) return false;
  return new Date(followUpAt).getTime() < Date.now();
}

/** Mic button that dictates into a notes field using the browser's built-in speech recognition. */
function VoiceDictateButton({ onResult }: { onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
      onResult(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  function toggle() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    else { recognitionRef.current?.start(); setListening(true); }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Stop dictating' : 'Dictate note by voice'}
      className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
        listening ? 'bg-red-50 border-red-300 text-red-600 animate-pulse' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}

export default function BuyerNetworkPage() {
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [interests, setInterests] = useState<MyInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyMatched, setOnlyMatched] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  const [modal, setModal] = useState<Requirement | null>(null);
  const [offerQty, setOfferQty] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMsg, setOfferMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState('');

  // Follow-up / notes editor (CRM deal card)
  const [dealEditor, setDealEditor] = useState<MyInterest | null>(null);
  const [followUp, setFollowUp] = useState('');
  const [notes, setNotes] = useState('');
  const [savingDeal, setSavingDeal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    if (tab === 'browse') {
      fetch('/api/recycler-portal/buyer-requests').then(r => r.json())
        .then(d => setRequirements(d.requirements ?? [])).catch(() => {}).finally(() => setLoading(false));
    } else {
      fetch('/api/recycler-portal/buyer-requests?view=mine').then(r => r.json())
        .then(d => setInterests(d.interests ?? [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  function openOffer(r: Requirement) {
    setModal(r);
    setOfferQty(r.myInterest?.offered_qty_mt ? String(r.myInterest.offered_qty_mt) : '');
    setOfferPrice(''); setOfferMsg(''); setBanner('');
  }

  async function submitOffer() {
    if (!modal) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/recycler-portal/buyer-requests/${modal.id}/express-interest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offered_qty_mt: offerQty, offered_price_inr: offerPrice, message: offerMsg }),
      });
      const d = await r.json();
      if (!r.ok) { setBanner(d.error || 'Failed'); return; }
      trackEvent('Recycler Buyer Offer Submitted', {});
      setModal(null); setBanner(d.message || 'Interest submitted.'); load();
    } finally { setSubmitting(false); }
  }

  function openDealEditor(i: MyInterest) {
    setDealEditor(i);
    setFollowUp(i.follow_up_at ? i.follow_up_at.slice(0, 10) : '');
    setNotes(i.crm_notes ?? '');
  }

  async function saveDeal() {
    if (!dealEditor) return;
    setSavingDeal(true);
    try {
      const r = await fetch(`/api/recycler-portal/buyer-requests/${dealEditor.requirement_id}/express-interest`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follow_up_at: followUp ? new Date(followUp).toISOString() : null,
          crm_notes: notes,
        }),
      });
      if (r.ok) { trackEvent('Recycler Buyer Deal Updated', {}); setDealEditor(null); load(); }
    } finally { setSavingDeal(false); }
  }

  const shown = onlyMatched ? requirements.filter(r => r.matched) : requirements;

  const columns: Record<string, MyInterest[]> = { PENDING: [], SHORTLISTED: [], ACCEPTED: [], DECLINED: [] };
  for (const i of interests) {
    if (i.status === 'DECLINED' || i.status === 'WITHDRAWN') columns.DECLINED.push(i);
    else if (columns[i.status]) columns[i.status].push(i);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyer Network</h1>
          <p className="text-sm text-gray-500 mt-1">
            Discover EPR credit requirements posted by Producers, Importers &amp; Brand Owners (PIBOs) and offer your credits.
          </p>
        </div>
        {tab === 'mine' && (
          <button
            onClick={() => setPresentationMode(p => !p)}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors border ${
              presentationMode ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Mask all price figures — useful when sharing your screen"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              {presentationMode
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />}
            </svg>
            {presentationMode ? 'Presentation Mode: On' : 'Presentation Mode'}
          </button>
        )}
      </div>

      {banner && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{banner}</div>}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          {([['browse', 'Browse Requirements'], ['mine', 'My Deals']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{l}</button>
          ))}
        </div>
        {tab === 'browse' && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={onlyMatched} onChange={e => setOnlyMatched(e.target.checked)} className="accent-teal-600" />
            Only my matches
          </label>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : tab === 'browse' ? (
        shown.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-sm font-medium text-gray-700">No open requirements right now</p>
            <p className="text-xs text-gray-400 mt-1">New PIBO credit requirements appear here. Check back soon or broaden your categories.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(r => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">{r.pibo_name}</span>
                      {r.pibo_type && <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{r.pibo_type}</span>}
                      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{r.waste_category}</span>
                      {r.matched && <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 border border-green-200">{r.matchScore}% Match</span>}
                      {r.myInterest && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${INTEREST_STATUS_STYLE[r.myInterest.status]}`}>Offer: {r.myInterest.status}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mt-2">
                      <div><span className="text-gray-500 text-xs">Required</span><p className="font-semibold text-gray-900">{r.required_qty_mt.toLocaleString('en-IN')} MT</p></div>
                      <div><span className="text-gray-500 text-xs">Target Price</span><p className="font-semibold text-teal-700">{fmtINR(r.target_price_inr, false)}{r.target_price_inr ? '/MT' : ''}</p></div>
                      <div><span className="text-gray-500 text-xs">States</span><p className="font-medium text-gray-700">{r.states?.length ? r.states.join(', ') : 'All India'}</p></div>
                      {r.fulfillment_period && <div><span className="text-gray-500 text-xs">Period</span><p className="font-medium text-gray-700">{r.fulfillment_period}</p></div>}
                    </div>
                    {r.description && <p className="text-xs text-gray-500 mt-2">{r.description}</p>}
                  </div>
                  <button onClick={() => openOffer(r)} className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">
                    {r.myInterest ? 'Update Offer' : 'Express Interest'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        interests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center"><p className="text-sm text-gray-500">You haven&apos;t made any offers yet. Deals you make will show up here as a pipeline.</p></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PIPELINE_COLUMNS.map(col => (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">{col.label}</h3>
                  <span className="text-xs font-semibold text-gray-400">{columns[col.key].length}</span>
                </div>
                <div className="space-y-3 min-h-[60px]">
                  {columns[col.key].map(i => {
                    const overdue = isOverdue(i.follow_up_at);
                    return (
                      <div key={i.id} className={`rounded-xl border bg-white p-4 space-y-2 ${overdue ? 'border-red-300' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">{i.requirement?.pibo_name ?? 'Requirement'}</span>
                          {i.requirement?.waste_category && <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{i.requirement.waste_category}</span>}
                        </div>
                        <p className="text-xs text-gray-500">
                          Offered {i.offered_qty_mt ?? '—'} MT{i.offered_price_inr ? ` @ ${fmtINR(i.offered_price_inr, presentationMode)}/MT` : ''}
                        </p>
                        {i.message && <p className="text-xs text-gray-600 italic">&ldquo;{i.message}&rdquo;</p>}

                        {i.follow_up_at && (
                          <p className={`text-[11px] font-medium flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {overdue ? 'Follow-up overdue: ' : 'Follow up: '}
                            {new Date(i.follow_up_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                        {i.crm_notes && <p className="text-[11px] text-gray-500 bg-gray-50 rounded-lg px-2 py-1 line-clamp-2">{i.crm_notes}</p>}

                        <button
                          onClick={() => openDealEditor(i)}
                          className="w-full rounded-lg border border-gray-200 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          {i.follow_up_at || i.crm_notes ? 'Edit Follow-up / Notes' : '+ Add Follow-up / Notes'}
                        </button>
                      </div>
                    );
                  })}
                  {columns[col.key].length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-[11px] text-gray-400">No deals</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Express Interest</h2>
                <p className="text-xs text-gray-500">{modal.pibo_name} · {modal.required_qty_mt} MT {modal.waste_category}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Quantity You Can Supply (MT)</label><input type="number" step={0.1} value={offerQty} onChange={e => setOfferQty(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Your Price (₹/MT)</label><input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder={modal.target_price_inr ? `Target: ${modal.target_price_inr}` : ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Message (optional)</label><textarea rows={3} value={offerMsg} onChange={e => setOfferMsg(e.target.value)} placeholder="Certifications, timelines, terms…" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" /></div>
            </div>
            {banner && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{banner}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={submitOffer} disabled={submitting} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit Offer'}</button>
            </div>
          </div>
        </div>
      )}

      {dealEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Follow-up &amp; Notes</h2>
                <p className="text-xs text-gray-500">{dealEditor.requirement?.pibo_name ?? 'Requirement'}</p>
              </div>
              <button onClick={() => setDealEditor(null)} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Next Follow-up Date</label>
                <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600">Private Notes (only you can see this)</label>
                  <VoiceDictateButton onResult={(text) => setNotes(n => (n ? n + ' ' : '') + text)} />
                </div>
                <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Called buyer on Monday, waiting on their procurement head to confirm quantity… (or use the mic to dictate)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDealEditor(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveDeal} disabled={savingDeal} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{savingDeal ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
