import { supabase } from '@/lib/supabaseClient';
import { safeLoginRedirect } from './loginRedirect';
export async function finishSignIn(returnUrl?: string | null) {
  const {data:{session},error}=await supabase.auth.getSession();
  if(error || !session) throw new Error('Your session has expired. Please sign in again.');
  document.cookie=`sb-access-token=${session.access_token}; Path=/; Max-Age=${session.expires_in ?? 3600}; SameSite=Lax${window.location.protocol==='https:'?'; Secure':''}`;
  const response=await fetch('/api/auth/destination',{cache:'no-store'});
  const value=await response.json();
  if(!response.ok) throw new Error(value.error || 'Unable to verify access');
  window.location.assign(safeLoginRedirect(returnUrl,value.destination));
}
