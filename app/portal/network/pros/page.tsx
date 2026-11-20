'use client';

import { useState, useEffect } from 'react';
import { Building2, Loader2, AlertTriangle } from 'lucide-react';
import { RecyclerCard } from '@/components/recycler-network/RecyclerCard';

interface PRO {
  id: string;
  recycler_code: string;
  name: string;
  type: 'PRO';
  epr_categories: string[];
  authorized_states: string[];
  verification_status: string;
  pro_registration_number: string | null;
  pro_valid_till: string | null;
  pro_members_count: number | null;
}

export default function NetworkPROsPage() {
  const [pros, setPros] = useState<PRO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/network/recyclers?type=PRO&limit=50');
        if (!res.ok) throw new Error((await res.json()).error);
        const { recyclers } = await res.json();
        setPros(recyclers ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load PROs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 py-16 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading PROs…
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 py-16 text-red-600">
      <AlertTriangle className="h-5 w-5" /> {error}
    </div>
  );

  if (!pros.length) return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Building2 className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mt-2 font-semibold text-slate-600">No PROs listed yet</p>
      <p className="mt-1 text-sm text-slate-400">Producer Responsibility Organizations will appear here once verified.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{pros.length} PRO{pros.length !== 1 ? 's' : ''} registered</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pros.map((p) => (
          <RecyclerCard
            key={p.id}
            id={p.id}
            recyclerCode={p.recycler_code}
            name={p.name}
            type="PRO"
            eprCategories={p.epr_categories}
            authorizedStates={p.authorized_states}
            verificationStatus={p.verification_status}
            href={`/portal/network/recyclers/${p.id}`}
          />
        ))}
      </div>
    </div>
  );
}
