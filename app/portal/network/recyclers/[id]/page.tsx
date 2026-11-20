'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, AlertTriangle, Link2, Unlink } from 'lucide-react';
import { RatingWidget } from '@/components/recycler-network/RatingWidget';
import { trackEvent } from '@/lib/analytics';

interface Recycler {
  id: string;
  recycler_code: string;
  name: string;
  type: string;
  epr_categories: string[];
  authorized_states: string[];
  verification_status: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
}

interface Rating {
  overall_score: number;
  timeliness: number;
  documentation: number;
  quantity_accuracy: number;
  compliance_score: number;
  responsiveness: number;
  is_manual_override: boolean;
  computed_at: string;
}

export default function RecyclerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [recycler, setRecycler] = useState<Recycler | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [linked, setLinked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    (async () => {
      try {
        const [detailRes, linksRes] = await Promise.all([
          fetch(`/api/network/recyclers/${id}`),
          fetch('/api/network/clients/me/recyclers'),
        ]);
        if (!detailRes.ok) throw new Error((await detailRes.json()).error);
        const { recycler: r, rating: rat } = await detailRes.json();
        setRecycler(r);
        setRating(rat);

        if (linksRes.ok) {
          const { links } = await linksRes.json();
          const activeLink = links.find((l: any) => l.recyclers?.id === id && l.status === 'ACTIVE');
          setLinked(!!activeLink);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleToggleLink() {
    if (!recycler) return;
    setActionLoading(true);
    try {
      if (!linked) {
        const res = await fetch('/api/network/clients/me/recyclers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recycler_id: recycler.id }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        trackEvent('Client Network Recycler Linked', {});
        setLinked(true);
        showToast('Linked to your network');
      } else {
        const res = await fetch(`/api/network/clients/me/recyclers/${recycler.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error);
        trackEvent('Client Network Recycler Unlinked', {});
        setLinked(false);
        showToast('Removed from network');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center gap-2 py-16 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );

  if (error || !recycler) return (
    <div className="flex items-center gap-2 py-16 text-red-600">
      <AlertTriangle className="h-5 w-5" />
      {error ?? 'Recycler not found'}
    </div>
  );

  return (
    <div className="space-y-6">
      <Link href="/portal/network/recyclers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ChevronLeft className="h-4 w-4" /> Back to Recyclers
      </Link>

      {toast && (
        <div role="status" aria-live="polite" className="rounded-lg bg-eco-green-5/10 px-4 py-2 text-sm text-eco-green-5">
          {toast}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-eco-green-5">{recycler.type}</span>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{recycler.name}</h1>
                <p className="text-sm text-slate-500">{recycler.recycler_code}</p>
              </div>
              <button
                onClick={handleToggleLink}
                disabled={actionLoading}
                aria-label={linked ? 'Remove from network' : 'Link to network'}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-eco-green-5 ${
                  linked
                    ? 'border border-red-200 text-red-600 hover:bg-red-50'
                    : 'bg-eco-green-5 text-white hover:bg-eco-green-4'
                } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {linked ? <Unlink className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {linked ? 'Unlink' : 'Link'}
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">EPR Categories</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {recycler.epr_categories.map((c) => (
                    <span key={c} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{c}</span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Authorized States</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{recycler.authorized_states.join(', ')}</dd>
              </div>
              {recycler.contact_email && (
                <div>
                  <dt className="text-xs text-slate-500">Contact Email</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{recycler.contact_email}</dd>
                </div>
              )}
              {recycler.contact_phone && (
                <div>
                  <dt className="text-xs text-slate-500">Phone</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{recycler.contact_phone}</dd>
                </div>
              )}
              {recycler.contact_address && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Address</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{recycler.contact_address}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Rating widget */}
        <div>
          {rating ? (
            <RatingWidget {...rating} />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-400">
              <p className="font-medium">No rating yet</p>
              <p className="mt-1">Ratings are computed from your interactions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
