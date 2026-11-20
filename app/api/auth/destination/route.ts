import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { getRoleHomePath } from '@/lib/auth/roleHome';

export async function GET() {
  try {
    const db:SupabaseClient=await createServerComponentClient();
    const {data:{user}}=await db.auth.getUser();
    if(!user) return NextResponse.json({error:'Sign in required'},{status:401});
    const {data:profile,error}=await db.from('profiles').select('role,is_banned,force_password_change').eq('id',user.id).maybeSingle();
    if(error) throw error;
    if(profile?.is_banned) return NextResponse.json({error:'Account access is suspended. Contact support.'},{status:403});
    let destination=profile?.role ? getRoleHomePath(profile.role, user.email) : '/welcome';
    if(destination==='/login') destination='/welcome';
    if(profile?.force_password_change) destination=profile.role==='viewer' ? '/portal/change-password' : `/${destination.split('/')[1]}/change-password`;
    // A client role does not itself provision a company workspace.
    if(destination==='/portal/dashboard' && profile?.role==='client') {
      const {data:client,error:clientError}=await db.from('clients').select('id').eq('profile_id',user.id).maybeSingle();
      if(clientError) throw clientError;
      if(!client) {
        // Owner-only legacy clients RLS hides the embedded company from team
        // members. The visible membership and its foreign key establish access.
        const {data:membership,error:membershipError}=await db.from('client_team_members').select('client_id').eq('user_id',user.id).eq('status','ACTIVE').maybeSingle();
        if(membershipError) throw membershipError;
        if(!membership?.client_id) destination='/welcome';
      }
    }
    return NextResponse.json({destination},{headers:{'Cache-Control':'private, no-store'}});
  } catch {return NextResponse.json({error:'Unable to verify account access. Please retry.'},{status:503});}
}
