import SharedDocumentsPage from '@/components/shared/SharedDocumentsPage';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';

export const metadata = { title: 'My Documents' };

export default async function PartnerDocumentsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?returnUrl=/partner/my-documents');

  return <SharedDocumentsPage heading="My Documents" />;
}
