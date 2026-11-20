'use client';

import { useState } from 'react';
import TourTarget from '@/components/portal/tour/TourTarget';
import { trackEvent } from '@/lib/analytics';

interface ReferralData {
  code: string;
  url: string;
  clicks: number;
  conversions: number;
}

export default function ReferralsClient({ referral }: { referral: ReferralData | null }) {
  const [copied, setCopied] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      trackEvent('Partner Referral Link Copied', {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!referral) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Referral Link Generator</h1>
          <p className="text-sm text-slate-500">Share your unique referral link to earn commissions on new clients.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">No referral link yet</p>
          <p className="mt-1 text-xs text-slate-400">Contact your relationship manager to generate your unique referral link.</p>
          <a
            href="mailto:supporteprcompass@gmail.com"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Request Referral Link
          </a>
        </div>
      </div>
    );
  }

  const conversionRate = referral.clicks > 0 ? Math.round((referral.conversions / referral.clicks) * 100) : 0;
  const whatsappMsg = encodeURIComponent(`Hi! I'd like to refer you to EPR Compass — India's trusted EPR compliance platform. Use my referral link: ${referral.url}`);
  const emailSubject = encodeURIComponent('EPR Compliance Solution for Your Business');
  const emailBody = encodeURIComponent(`Hi,\n\nI'd like to introduce you to EPR Compass, India's leading EPR compliance platform.\n\nSign up using my referral link: ${referral.url}\n\nBest regards`);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Referral Link Generator</h1>
        <p className="text-sm text-slate-500">Share your unique referral link to earn commissions on new clients.</p>
      </div>

      {/* Stats */}
      <TourTarget id="referrals-summary-cards" className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Clicks</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{referral.clicks}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Conversions</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{referral.conversions}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Conversion Rate</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-700">{conversionRate}%</p>
        </div>
      </TourTarget>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Referral link card */}
        <TourTarget id="referrals-link-card" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Your Referral Link</h2>

          <div>
            <p className="text-xs text-slate-500 mb-1">Referral Code</p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <code className="flex-1 text-sm font-mono font-semibold text-indigo-700">{referral.code}</code>
              <button onClick={() => copy(referral.code)} className="text-xs text-slate-500 hover:text-slate-900 transition">Copy</button>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Full URL</p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="flex-1 text-xs text-slate-700 break-all">{referral.url}</span>
              <button
                onClick={() => copy(referral.url)}
                className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('Partner Referral Shared', { channel: 'whatsapp' })}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.934 1.395 5.608L0 24l6.556-1.375A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.817 9.817 0 01-5.001-1.368l-.36-.213-3.891.816.828-3.807-.234-.371A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
              WhatsApp
            </a>
            <a
              href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
              onClick={() => trackEvent('Partner Referral Shared', { channel: 'email' })}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          </div>
        </TourTarget>

        {/* QR Code */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 self-start">QR Code</h2>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(referral.url)}`}
            alt="Referral QR Code"
            className="rounded-lg border border-slate-200"
            width={150}
            height={150}
          />
          <p className="text-xs text-slate-500 text-center">Scan to open your referral link</p>
        </div>
      </div>
    </div>
  );
}

