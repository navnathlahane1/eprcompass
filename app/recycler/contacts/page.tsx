import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Contacts | Recycler Portal',
  description: 'Key contacts registered for your recycler facility.',
};

export default async function RecyclerContactsPage() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: recycler } = await (supabase as any)
    .from('recyclers')
    .select('id, contact_person, email, phone')
    .eq('email', user.email)
    .maybeSingle();

  if (!recycler) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-sm text-slate-600">
            Your recycler profile is not linked to this account. Contact EPR Compass support.
          </p>
        </div>
      </div>
    );
  }

  const contacts = recycler.contact_person
    ? [
        {
          name: recycler.contact_person,
          designation: 'Primary Contact',
          email: recycler.email,
          phone: recycler.phone,
          primary: true,
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Contacts</h1>
        <p className="mt-1 text-sm text-slate-600">Key contacts registered for your recycler facility.</p>
      </section>

      {contacts.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">
            No contact information on file. Contact support to update your profile.
          </p>
        </section>
      ) : (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Primary</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((row) => (
                <tr key={`${row.name}-${row.email}`} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.designation}</td>
                  <td className="px-4 py-3 text-slate-700">{row.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {row.primary ? (
                      <span className="inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
                        Primary
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

