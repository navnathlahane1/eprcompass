import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import AiDocumentationCenterClient from './AiDocumentationCenterClient';

export const metadata = {
  title: 'AI Documentation Center | Admin',
};

export default async function AIDocumentationCenterPage() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  if (!isSuperAdmin(user.email)) {
    redirect('/admin/dashboard');
  }

  return <AiDocumentationCenterClient />;
}
