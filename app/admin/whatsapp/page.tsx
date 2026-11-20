import Link from 'next/link';
import { redirect } from 'next/navigation';
import ConversationThread from './ConversationThread';
import { createServerComponentClient } from '../../../lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

export default async function ConversationsPage({
  searchParams
}: {
  searchParams?: Promise<{ c?: string }>;
}) {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin' && !isSuperAdmin(user.email)) redirect('/admin/dashboard');

  const { data: conversations } = await (supabase as any)
    .from('whatsapp_conversations')
    .select('id, phone_no, wa_contact_name, entity_type, status, last_message_at, created_at')
    .order('last_message_at', { ascending: false });

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedId = resolvedSearchParams?.c || (conversations?.[0]?.id || null);
  const selected = (conversations || []).find((c: any) => c.id === selectedId) || null;

  const { data: messages } = selected
    ? await (supabase as any)
        .from('whatsapp_messages')
        .select('id, direction, message_type, content, template_name, status, sent_at, created_at')
        .eq('conversation_id', selected.id)
        .order('created_at', { ascending: true })
    : { data: [] };

  return (
    <div className="space-y-4 p-4 text-slate-100 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">WhatsApp Conversations</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/whatsapp/leads" className="rounded-md border border-slate-700 px-3 py-1.5 hover:bg-slate-950">
            Lead Captures
          </Link>
          <Link href="/admin/whatsapp/broadcast" className="rounded-md border border-slate-700 px-3 py-1.5 hover:bg-slate-950">
            Broadcast
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {(conversations || []).map((row: any) => (
                  <tr key={row.id} className="border-b border-slate-800/60">
                    <td className="px-3 py-2">
                      <Link href={`/admin/whatsapp?c=${row.id}`} className="text-teal-700 hover:underline">
                        {row.phone_no}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{row.wa_contact_name || '-'}</td>
                    <td className="px-3 py-2">{row.entity_type}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">{row.last_message_at ? new Date(row.last_message_at).toLocaleString('en-IN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-7">
          {selected ? (
            <ConversationThread phone={selected.phone_no} initialMessages={messages || []} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-500">
              No conversation selected.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
