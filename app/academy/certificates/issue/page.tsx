'use client';

import { useState, useEffect } from 'react';

interface Learner {
  id: string;
  name: string;
  email: string;
  phone: string;
  programs: string[];
  status: string;
}

const CERT_TYPES = [
  { id: 'attendance', label: 'Attendance Certificate', tier: 'Tier 1', desc: 'Awarded on completing awareness session', color: 'border-sky-500/40 bg-sky-500/5', accent: 'text-sky-400' },
  { id: 'cepc',       label: 'CEPC Certificate',       tier: 'Tier 2', desc: 'Certified EPR Practitioner (Compliance)', color: 'border-violet-500/40 bg-violet-500/5', accent: 'text-violet-400' },
  { id: 'ealp',       label: 'EALP Certificate',       tier: 'Tier 3', desc: 'EPR Advanced Leadership Programme', color: 'border-amber-500/40 bg-amber-500/5', accent: 'text-amber-400' },
  { id: 't3trainer',  label: 'T3 Trainer Certificate', tier: 'T3 Trainer', desc: 'Authorised to deliver Tier 1 & 2 training', color: 'border-rose-500/40 bg-rose-500/5', accent: 'text-rose-400' },
  { id: 'participation', label: 'Participation Certificate', tier: 'All', desc: 'For workshop/event participants', color: 'border-emerald-500/40 bg-emerald-500/5', accent: 'text-emerald-400' },
];

const CERT_PREFIX: Record<string, string> = {
  attendance: 'T1', cepc: 'CEPC', ealp: 'EALP', t3trainer: 'T3TR', participation: 'PART'
};

function generateCertId(type: string) {
  const prefix = CERT_PREFIX[type] || 'T1';
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  return `EPR-${prefix}-2026-${stamp}`;
}

export default function IssueCertificatePage() {
  type IssuedCert = { certId: string; learner: string; program: string; certType: string; certLabel: string; completionDate: string; partnerName: string };

  const [learners, setLearners]     = useState<Learner[]>([]);
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [step, setStep]             = useState(1);
  const [learner, setLearner]       = useState('');
  const [learnerQ, setLearnerQ]     = useState('');
  const [showDD, setShowDD]         = useState(false);
  const [program, setProgram]       = useState('');
  const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [certType, setCertType]     = useState('');
  const [partnerDelivered, setPartnerDelivered] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [certId, setCertId]         = useState(() => generateCertId('cepc'));
  const [showToast, setShowToast]   = useState(false);
  const [issued, setIssued]         = useState<IssuedCert[]>([]);

  useEffect(() => {
    fetch('/api/academy/learners')
      .then(r => r.json())
      .then(d => setLearners(d.learners ?? []))
      .catch(() => setLearners([]))
      .finally(() => setLoadingLearners(false));
  }, []);

  const filteredLearners = learners.filter(l =>
    l.name.toLowerCase().includes(learnerQ.toLowerCase()) ||
    l.email.toLowerCase().includes(learnerQ.toLowerCase())
  );

  const selectedLearner = learners.find(l => l.name === learner);
  const selectedCert = CERT_TYPES.find(c => c.id === certType);

  function handleIssue() {
    const newCert: IssuedCert = {
      certId,
      learner,
      program,
      certType,
      certLabel: selectedCert?.label ?? certType,
      completionDate,
      partnerName: partnerDelivered ? partnerName : '',
    };
    setIssued(prev => [newCert, ...prev]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
    setStep(1);
    setLearner('');
    setLearnerQ('');
    setProgram('');
    setCompletionDate(new Date().toISOString().slice(0, 10));
    setCertType('');
    setPartnerDelivered(false);
    setPartnerName('');
    setCertId(generateCertId(certType));
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 shadow-lg">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-sm font-semibold text-emerald-300">Certificate issued successfully!</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Issue Certificate</h1>
        <p className="mt-0.5 text-sm text-slate-500">Generate and issue a new certificate for a learner</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1,2,3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{s}</div>
            <span className={`text-xs font-medium ${step >= s ? 'text-slate-200' : 'text-slate-600'}`}>
              {s === 1 ? 'Learner & Program' : s === 2 ? 'Certificate Type' : 'Co-branding'}
            </span>
            {s < 3 && <div className={`mx-2 h-px w-10 ${step > s ? 'bg-indigo-500' : 'bg-slate-700'}`}/>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-4">

          {/* Step 1 */}
          {step === 1 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Step 1 — Learner & Program</h2>

              {/* Learner dropdown */}
              <div className="relative">
                <label className="block mb-1 text-xs font-medium text-slate-400">Select Learner</label>
                <input
                  value={learnerQ}
                  onChange={e => { setLearnerQ(e.target.value); setShowDD(true); }}
                  onFocus={() => setShowDD(true)}
                  placeholder={loadingLearners ? 'Loading learners…' : 'Search by name or email…'}
                  disabled={loadingLearners}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                {showDD && filteredLearners.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-700 bg-[#0c1022] shadow-lg max-h-48 overflow-y-auto">
                    {filteredLearners.map(l => (
                      <button key={l.id} onClick={() => {
                        setLearner(l.name);
                        setLearnerQ(l.name);
                        setShowDD(false);
                        if (l.programs.length === 1) setProgram(l.programs[0]);
                      }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-800 transition">
                        <p className="text-sm text-slate-300">{l.name}</p>
                        <p className="text-xs text-slate-500">{l.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {showDD && !loadingLearners && filteredLearners.length === 0 && learnerQ.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-700 bg-[#0c1022] shadow-lg px-3 py-3">
                    <p className="text-sm text-slate-500">No learners found for "{learnerQ}"</p>
                  </div>
                )}
                {learner && <p className="mt-1 text-xs text-emerald-400">Selected: {learner}</p>}
              </div>

              {/* Programs from learner's enrollments */}
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-400">Program</label>
                <select value={program} onChange={e => setProgram(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Select program…</option>
                  {selectedLearner?.programs.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="E-Waste Awareness (Tier 1)">E-Waste Awareness (Tier 1)</option>
                  <option value="Plastic Waste Awareness (Tier 1)">Plastic Waste Awareness (Tier 1)</option>
                  <option value="CEPC — E-Waste Compliance (Tier 2)">CEPC — E-Waste Compliance (Tier 2)</option>
                  <option value="CEPC — Battery Waste (Tier 2)">CEPC — Battery Waste (Tier 2)</option>
                  <option value="EALP — Sustainability Leadership (Tier 3)">EALP — Sustainability Leadership (Tier 3)</option>
                  <option value="T3 Trainer Certification">T3 Trainer Certification</option>
                </select>
              </div>

              {/* Completion Date */}
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-400">Completion Date</label>
                <input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
              </div>

              <button onClick={() => setStep(2)} disabled={!learner || !program}
                className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed">
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Step 2 — Certificate Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CERT_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => { setCertType(ct.id); setCertId(generateCertId(ct.id)); }}
                    className={`rounded-xl border-2 p-4 text-left transition ${certType === ct.id ? ct.color + ' ring-2 ring-indigo-500' : 'border-slate-800 bg-slate-800/20 hover:bg-slate-800/40'}`}>
                    <p className={`text-sm font-semibold ${certType === ct.id ? ct.accent : 'text-slate-200'}`}>{ct.label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{ct.tier}</p>
                    <p className="mt-1 text-xs text-slate-400">{ct.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(1)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition">← Back</button>
                <button onClick={() => setStep(3)} disabled={!certType}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Step 3 — Co-branding</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setPartnerDelivered(p => !p)}
                  className={`relative h-6 w-11 rounded-full transition ${partnerDelivered ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${partnerDelivered ? 'left-6' : 'left-1'}`}/>
                </div>
                <span className="text-sm text-slate-300">Partner-delivered batch</span>
              </label>
              {partnerDelivered && (
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-400">Partner Organisation Name</label>
                  <input value={partnerName} onChange={e => setPartnerName(e.target.value)}
                    placeholder="e.g. GreenSphere Consulting"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                  <p className="mt-1 text-xs text-slate-500">Partner name will appear on the certificate footer.</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(2)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition">← Back</button>
                <button onClick={handleIssue}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition">
                  Issue Certificate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-4 rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Certificate Preview</p>

            <div className="rounded-lg bg-white p-5" style={{ minHeight: 320 }}>
              <div className="rounded border-4 border-double border-slate-300 p-4 h-full flex flex-col items-center text-center space-y-3">
                <p className="text-[11px] font-bold tracking-widest uppercase text-indigo-700">EPR Compass</p>
                <p className="text-[9px] text-slate-500 tracking-wider uppercase">Certificate of Achievement</p>
                <div className="w-12 h-px bg-slate-300"/>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500">This is to certify that</p>
                  <p className="font-serif text-2xl font-bold text-slate-800">{learner || 'Learner Name'}</p>
                </div>

                <p className="text-[10px] text-slate-500 max-w-[200px]">
                  has successfully completed the program
                </p>
                <p className="text-xs font-semibold text-indigo-700 max-w-[200px]">
                  {program || 'Program Name'}
                </p>
                {selectedCert && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700">{selectedCert.label}</span>
                )}
                {partnerDelivered && partnerName && (
                  <p className="text-[9px] text-slate-500">Delivered in partnership with <span className="font-semibold">{partnerName}</span></p>
                )}

                <div className="w-12 h-px bg-slate-300"/>

                <div className="flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded bg-slate-200 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="currentColor"><path d="M3 3h6v6H3V3zm1 1v4h4V4H4zm8-1h6v6h-6V3zm1 1v4h4V4h-4zM3 11h6v6H3v-6zm1 1v4h4v-4H4zm11 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm-4-6h2v2h-2v-2zm0 4h2v2h-2v-2z"/></svg>
                  </div>
                  <p className="text-[8px] text-slate-400">Scan to Verify</p>
                </div>

                <div className="text-center mt-1">
                  <p className="text-[9px] font-semibold text-slate-700">EPR Compass</p>
                  <p className="text-[8px] text-slate-500">Academy Director</p>
                  <p className="text-[8px] text-slate-400">Authorized Training Team</p>
                </div>

                <p className="text-[8px] text-slate-400 font-mono">{certId}</p>
                <p className="text-[8px] text-slate-400">{completionDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issued this session */}
      {issued.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <p className="mb-3 text-sm font-semibold text-slate-200">Issued This Session ({issued.length})</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Cert ID', 'Learner', 'Program', 'Type', 'Date', 'Partner'].map(h => (
                    <th key={h} className="pb-2 pr-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {issued.map(c => (
                  <tr key={c.certId}>
                    <td className="py-2 pr-4 font-mono text-emerald-400">{c.certId}</td>
                    <td className="py-2 pr-4 text-slate-300">{c.learner}</td>
                    <td className="py-2 pr-4 text-slate-400 max-w-[160px] truncate">{c.program}</td>
                    <td className="py-2 pr-4 text-slate-400">{c.certLabel}</td>
                    <td className="py-2 pr-4 text-slate-500">{c.completionDate}</td>
                    <td className="py-2 pr-4 text-slate-500">{c.partnerName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

