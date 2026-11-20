import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { parseRegistration } from '@/lib/onboarding/registration';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function GET() {
  try {
    const db:SupabaseClient=await createServerComponentClient();
    const {data:{user}}=await db.auth.getUser();
    if (!user) return NextResponse.json({error:'Sign in required'},{status:401});
    const {data,error}=await db.from('registration_profiles').select('*').eq('user_id',user.id).maybeSingle();
    if(error) throw error;
    return NextResponse.json({registration:data},{headers:{'Cache-Control':'private, no-store'}});
  } catch {return NextResponse.json({error:'Onboarding is unavailable. Please contact support.'},{status:503});}
}
export async function POST(req:NextRequest) {
  const rejected=rejectUnsafeWorkspaceWrite(req); if(rejected) return rejected;
  try {
    const db:SupabaseClient=await createServerComponentClient();
    const {data:{user}}=await db.auth.getUser();
    if(!user || !user.email_confirmed_at) return NextResponse.json({error:'Verify your email first'},{status:401});
    let parsed; try {parsed=parseRegistration(await req.json());} catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid details'},{status:400});}
    const {data:existing,error:readError}=await db.from('registration_profiles').select('status').eq('user_id',user.id).maybeSingle();
    if(readError) throw readError;
    if(existing && existing.status!=='pending') return NextResponse.json({error:'Contact support to update a reviewed registration'},{status:409});
    const query=existing ? db.from('registration_profiles').update(parsed).eq('user_id',user.id) : db.from('registration_profiles').insert({...parsed,user_id:user.id});
    const {data,error}=await query.select('user_id').maybeSingle();
    if(error || !data) throw error ?? new Error('Not saved');
    return NextResponse.json({saved:true});
  } catch {return NextResponse.json({error:'Unable to save. Please retry or contact support.'},{status:503});}
}
