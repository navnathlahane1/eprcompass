'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type CertStatus = 'valid' | 'expiring_soon' | 'expired' | 'missing';

interface CertStatusResponse {
  cpcb_cert_no: string | null;
  cpcb_cert_expiry: string | null;
  days_until_expiry: number | null;
  status: CertStatus;
}

const STATUS_CONFIG: Record<CertStatus, { label: string; badgeClass: string; cardClass: string }> = {
  valid: {
    label: 'Valid',
    badgeClass: 'bg-green-100 text-green-700 border border-green-200',
    cardClass: 'border-green-200 bg-green-50',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
    cardClass: 'border-amber-200 bg-amber-50',
  },
  expired: {
    label: 'Expired',
    badgeClass: 'bg-red-100 text-red-700 border border-red-200',
    cardClass: 'border-red-200 bg-red-50',
  },
  missing: {
    label: 'Missing',
    badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
    cardClass: 'border-gray-200 bg-gray-50',
  },
};

const RENEWAL_STEPS = [
  {
    step: 1,
    title: 'Apply for renewal with CPCB',
    description: 'Submit your renewal application to CPCB at least 90 days before your certificate expiry.',
    timing: '90 days before expiry',
  },
  {
    step: 2,
    title: 'Upload renewed certificate to My Documents',
    description: 'Once you receive the renewed certificate, upload it in the My Documents section.',
    timing: 'On receipt',
  },
  {
    step: 3,
    title: 'Team verifies new certificate',
    description: 'Our compliance team will verify the authenticity of your uploaded certificate.',
    timing: '1–3 business days',
  },
  {
    step: 4,
    title: 'Status updates to active',
    description: 'After verification, your certificate status will update to active and the banner will clear.',
    timing: 'Post-verification',
  },
];

export default function CertRenewalPage() {
  const [data, setData] = useState<CertStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/recycler-portal/cert-status')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d);
      })
      .catch(() => setError('Failed to load certificate status'))
      .finally(() => setLoading(false));
  }, []);

  const status = data?.status ?? 'missing';
  const config = STATUS_CONFIG[status];

  const expiryFormatted = data?.cpcb_cert_expiry
    ? new Date(data.cpcb_cert_expiry).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CPCB Certificate Renewal</h1>
        <p className="text-sm text-gray-500 mt-1">Track your certificate status and manage renewal steps</p>
      </div>

      {/* Current status card */}
      {loading ? (
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      ) : (
        <div className={`rounded-xl border p-6 ${config.cardClass}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Certificate Number</p>
              <p className="text-lg font-semibold text-gray-900">{data?.cpcb_cert_no ?? '—'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.badgeClass}`}>
              {config.label}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry Date</p>
              <p className="text-base font-medium text-gray-800 mt-0.5">{expiryFormatted}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days Remaining</p>
              <p className={`text-base font-semibold mt-0.5 ${
                status === 'expired' ? 'text-red-600' :
                status === 'expiring_soon' ? 'text-amber-600' :
                'text-gray-800'
              }`}>
                {data?.days_until_expiry != null
                  ? data.days_until_expiry < 0
                    ? `${Math.abs(data.days_until_expiry)} days overdue`
                    : `${data.days_until_expiry} days`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Renewal timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Renewal Steps</h2>
        <ol className="relative border-l border-gray-200 space-y-6 ml-3">
          {RENEWAL_STEPS.map(({ step, title, description, timing }) => (
            <li key={step} className="ml-6">
              <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                {step}
              </span>
              <p className="font-semibold text-gray-900 text-sm">{title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{description}</p>
              <span className="inline-block mt-1 text-xs text-gray-400">{timing}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/recycler-portal/my-documents"
          className="flex-1 text-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Upload Certificate in My Documents
        </Link>
        <a
          href="tel:01143102030"
          className="flex-1 text-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:border-gray-400 transition-colors"
        >
          📞 CPCB Helpline: 011-43102030
        </a>
      </div>

      <div className="text-center">
        <Link href="/recycler-portal/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
