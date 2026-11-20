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

export default function CertRenewalBanner() {
  const [data, setData] = useState<CertStatusResponse | null>(null);

  useEffect(() => {
    fetch('/api/recycler-portal/cert-status')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => null);
  }, []);

  if (!data) return null;
  if (data.status === 'valid') return null;

  const expiryDateStr = data.cpcb_cert_expiry
    ? new Date(data.cpcb_cert_expiry).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  if (data.status === 'expiring_soon') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
        <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
        <div className="flex-1 text-sm text-amber-800">
          <span className="font-semibold">Your CPCB Certificate expires in {data.days_until_expiry} days.</span>{' '}
          Renew before {expiryDateStr} to avoid suspension.
        </div>
        <Link
          href="/recycler-portal/my-documents"
          className="shrink-0 text-sm font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap"
        >
          Update →
        </Link>
      </div>
    );
  }

  if (data.status === 'expired') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
        <span className="text-red-500 text-lg shrink-0 mt-0.5">🚨</span>
        <div className="flex-1 text-sm text-red-800">
          <span className="font-semibold">Your CPCB Certificate has expired.</span>{' '}
          Upload a renewed certificate immediately.
        </div>
        <Link
          href="/recycler-portal/my-documents"
          className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-900 whitespace-nowrap"
        >
          Update →
        </Link>
      </div>
    );
  }

  // missing
  return (
    <div className="flex items-start gap-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3">
      <span className="text-yellow-500 text-lg shrink-0 mt-0.5">ℹ️</span>
      <div className="flex-1 text-sm text-yellow-800">
        <span className="font-semibold">CPCB Certificate details missing.</span>{' '}
        Add your certificate number and expiry date in My Profile.
      </div>
      <Link
        href="/recycler-portal/my-documents"
        className="shrink-0 text-sm font-semibold text-yellow-700 hover:text-yellow-900 whitespace-nowrap"
      >
        Update →
      </Link>
    </div>
  );
}
