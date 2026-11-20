import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { redirect } from 'next/navigation';
import NewServiceRequestForm from './NewServiceRequestForm';

export const metadata = { title: 'New Service Request | Client Portal' };

export default async function NewServiceRequestPage() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== 'client') redirect('/portal/login');

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">New Service Request</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell us what you need — our team will review and send a quotation within 24 hours.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <NewServiceRequestForm />
      </div>
    </div>
  );
}
