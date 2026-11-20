'use client';

import { useParams } from 'next/navigation';

const MOCK_CERTS: Record<string, {
  learner: string; program: string; tier: string; issued: string; expires: string; authority: string;
}> = {
  'EPR-T1-2026-001':   { learner: 'Amit Joshi',     program: 'E-Waste Awareness',          tier: 'Tier 1',     issued: '2026-05-01', expires: '2027-05-01', authority: 'EPR Compass' },
  'EPR-CEPC-2026-012': { learner: 'Sunita Mehta',   program: 'CEPC — Plastic Waste',       tier: 'Tier 2',     issued: '2026-05-03', expires: '2028-05-03', authority: 'EPR Compass' },
  'EPR-EALP-2026-003': { learner: 'Ravi Kumar',     program: 'EALP — Battery Waste',       tier: 'Tier 3',     issued: '2026-05-05', expires: '2029-05-05', authority: 'EPR Compass' },
  'EPR-T3TR-2026-005': { learner: 'Priya Iyer',     program: 'T3 Trainer Certification',   tier: 'T3 Trainer', issued: '2026-05-07', expires: '2028-05-07', authority: 'EPR Compass' },
  'EPR-CEPC-2026-013': { learner: 'Neha Verma',     program: 'CEPC — E-Waste',             tier: 'Tier 2',     issued: '2026-05-10', expires: '2028-05-10', authority: 'EPR Compass' },
  'EPR-EALP-2026-004': { learner: 'Vikram Nair',    program: 'EALP — E-Waste Leadership',  tier: 'Tier 3',     issued: '2026-05-15', expires: '2029-05-15', authority: 'EPR Compass' },
  'EPR-T3TR-2026-006': { learner: 'Meera Krishnan', program: 'T3 Trainer Certification',   tier: 'T3 Trainer', issued: '2026-05-16', expires: '2028-05-16', authority: 'EPR Compass' },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VerifyPage() {
  const params = useParams();
  const certId = decodeURIComponent(params.certId as string);

  const isValid = certId.startsWith('EPR-');
  const cert = MOCK_CERTS[certId];
  const found = isValid && !!cert;

  return (
    <div className="min-h-screen bg-[#060910] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo header */}
      <div className="mb-8 text-center">
        <p className="text-lg font-bold tracking-widest text-indigo-400 uppercase">EPR Compass</p>
        <p className="text-xs text-slate-500 mt-0.5">Certificate Verification Portal</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg rounded-2xl border border-slate-800/80 bg-[#0c1022] p-8 shadow-2xl">

        {/* Status Badge */}
        {found ? (
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-500/40">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-400">VERIFIED ✓</p>
              <p className="text-xs text-slate-500 mt-0.5">This certificate is authentic and valid</p>
            </div>
          </div>
        ) : isValid ? (
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 border-2 border-amber-500/40">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-amber-400">NOT FOUND</p>
              <p className="text-xs text-slate-500 mt-0.5">Certificate ID not found in our records</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 border-2 border-rose-500/40">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-rose-400">INVALID</p>
              <p className="text-xs text-slate-500 mt-0.5">This does not appear to be a valid EPR certificate ID</p>
            </div>
          </div>
        )}

        {/* Cert ID */}
        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Certificate ID</p>
          <p className="font-mono text-sm text-indigo-300">{certId}</p>
        </div>

        {/* Details */}
        {found && cert && (
          <div className="space-y-3 mb-6">
            {[
              { label: 'Learner Name',      value: cert.learner },
              { label: 'Program',           value: cert.program },
              { label: 'Tier',              value: cert.tier },
              { label: 'Issue Date',        value: fmt(cert.issued) },
              { label: 'Expiry Date',       value: fmt(cert.expires) },
              { label: 'Issuing Authority', value: 'EPR Compass' },
              { label: 'Certified By',      value: 'EPR Compass' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-4 border-b border-slate-800/60 pb-2">
                <span className="text-xs text-slate-500 shrink-0">{r.label}</span>
                <span className="text-xs font-semibold text-slate-200 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* QR Placeholder */}
        <div className="flex flex-col items-center gap-2 my-4">
          <div className="h-20 w-20 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
            <svg viewBox="0 0 24 24" className="h-12 w-12 text-slate-600" fill="currentColor">
              <path d="M3 3h6v6H3V3zm1 1v4h4V4H4zm8-1h6v6h-6V3zm1 1v4h4V4h-4zM3 11h6v6H3v-6zm1 1v4h4v-4H4zm11 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm-4-6h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
            </svg>
          </div>
          <p className="text-[10px] text-slate-500">QR Code Placeholder</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-1">
        <p className="text-xs text-slate-600">Verify certificates at</p>
        <p className="text-sm font-semibold text-indigo-400">EPR Compass/verify</p>
        <p className="text-xs text-slate-700 mt-2">© 2026 EPR Compass — EPR compliance training</p>
      </div>
    </div>
  );
}

