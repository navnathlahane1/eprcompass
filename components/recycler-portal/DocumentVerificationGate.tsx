'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type VerificationStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'BLACKLISTED' | null;

interface MeResponse {
  recycler?: { verification_status: string };
}

interface Props {
  children: React.ReactNode;
}

export default function DocumentVerificationGate({ children }: Props) {
  const [status, setStatus] = useState<VerificationStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recycler-portal/me')
      .then((r) => r.json())
      .then((data: MeResponse) => {
        setStatus((data.recycler?.verification_status ?? 'PENDING') as VerificationStatus);
      })
      .catch(() => setStatus('PENDING'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === 'VERIFIED') return <>{children}</>;

  if (status === 'SUSPENDED') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 border border-red-200">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-900">Account Suspended</h2>
            <p className="text-sm text-red-700 mt-0.5">
              Your recycler account has been suspended. Please contact us through the site contact page: {' '}
              <a href="/contact" className="underline">
              Contact us
              </a>{' '}
              for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'BLACKLISTED') {
    return (
      <div className="rounded-xl border border-gray-300 bg-gray-50 p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 border border-gray-300">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">Access Restricted</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Access to this feature has been permanently restricted. Contact support if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PENDING (default)
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 border border-amber-200">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-amber-900">Verification Pending</h2>
          <p className="text-sm text-amber-700 mt-0.5">
            This feature will be unlocked once our team has reviewed and approved your profile and documents.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="rounded-lg border border-amber-200 bg-white divide-y divide-gray-100 overflow-hidden">
        {[
          { step: 1, label: 'Complete your profile', sub: 'Name, address, waste categories, capacity', done: true },
          { step: 2, label: 'Upload required documents', sub: 'CPCB Certificate, GST, Bank Details', href: '/recycler-portal/my-documents' },
          { step: 3, label: 'Team reviews & approves', sub: 'Usually within 1–2 business days' },
          { step: 4, label: 'Features unlock automatically', sub: 'Tenders, Auctions, Corporate Requests, Govt Tenders' },
        ].map(({ step, label, sub, done, href }) => (
          <div key={step} className="flex items-start gap-3 px-4 py-3">
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
              {done ? '✓' : step}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </div>
            {href && (
              <Link href={href} className="text-xs text-amber-600 font-medium underline shrink-0">
                Upload →
              </Link>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-amber-700">
        You will receive an email at your registered address once your account is verified.
        For urgent queries, please use the site contact page: {' '}
        <a href="/contact" className="underline">
          our contact page
        </a>
        .
      </p>
    </div>
  );
}

