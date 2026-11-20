'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyLookupPage() {
  const router = useRouter();
  const [id, setId] = useState('');

  return (
    <main className="epr-public min-h-[70vh] bg-[#fbfdfc]">
      <section className="epr-container max-w-xl py-14">
        <p className="epr-eyebrow">Certificate verify</p>
        <h1 className="epr-display-inner mt-3">Confirm an EPR Compass record</h1>
        <p className="mt-3 text-base text-[var(--epr-muted)]">
          Enter the public verification ID from a certificate, QR code, or client share link. We show masked GSTIN, categories, and filing status — not private documents.
        </p>
        <form
          className="mt-8 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const value = id.trim();
            if (value) router.push(`/verify/${encodeURIComponent(value)}`);
          }}
        >
          <label className="block text-sm font-semibold text-[var(--epr-ink)]">
            Verification ID
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--epr-border)] px-3 py-3 text-base"
              placeholder="Paste public_verify_id"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="epr-button epr-button-primary w-full">
            Verify
          </button>
        </form>
        <p className="mt-6 text-sm text-[var(--epr-muted)]">
          Need a copy for your file? Open a verified page and use Share. Read{' '}
          <Link href="/trust" className="font-semibold text-[var(--epr-green)]">
            how access works
          </Link>
          .
        </p>
      </section>
    </main>
  );
}

