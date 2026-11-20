import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import NewClientForm from './NewClientForm';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Client | Admin – EPR Compass' };

export default async function NewClientPage() {
  const supabase = await createServerComponentClient();

  const { data: managers } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, company_name')
    .in('role', ['admin', 'manager'])
    .order('full_name', { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">New Client</h1>
          <p className="mt-1 text-sm text-slate-500">
            Creates a Supabase Auth user, a client profile, and a client record.
          </p>
        </div>
        <Link
          href="/admin/crm/clients"
          className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950"
        >
          ← Clients
        </Link>
      </div>

      <NewClientForm managers={managers || []} />
    </div>
  );
}

