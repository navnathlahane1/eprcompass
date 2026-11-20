'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ArrowUpRight, RefreshCw, ClipboardCheck } from 'lucide-react';

export default function OverviewHeader() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
      <div>
        <p className="mb-1 text-xs font-medium text-emerald-700">Operations workspace</p>
        <h1 className="text-2xl font-semibold text-zinc-950">Overview</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" title="Refresh overview" aria-label="Refresh overview" disabled={pending}
          onClick={() => startTransition(() => router.refresh())}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
        </button>
        <Link href="/admin/service-requests" className="flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">Service requests<ArrowUpRight className="h-3.5 w-3.5" /></Link>
        <Link href="/admin/registrations" className="flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"><ClipboardCheck className="h-4 w-4" />Review registrations</Link>
      </div>
    </div>
  );
}
