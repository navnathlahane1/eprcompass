import SharedDocumentsPage from '@/components/shared/SharedDocumentsPage';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';

export const metadata = { title: 'User Documents — Admin' };

export default async function AdminUserDocumentsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?returnUrl=/admin/user-documents');

  return <SharedDocumentsPage heading="User Documents" />;
}
