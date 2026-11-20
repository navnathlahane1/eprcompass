import { NextRequest,NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function GET(req:NextRequest) {
  try {
    const db:SupabaseClient=await createServerComponentClient();
    const {data:{user}}=await db.auth.getUser();
    if(!user) return NextResponse.json({error:'Sign in required'},{status:401});
    const reviewer=await db.rpc('registration_reviewer_allowed');
    if(reviewer.error) throw reviewer.error;
    if(!reviewer.data) return NextResponse.json({error:'Admin or manager access required'},{status:403});
    const status=req.nextUrl.searchParams.get('status') ?? 'pending';
    const page=Number(req.nextUrl.searchParams.get('page') ?? 0);
    if(!['pending','approved','rejected'].includes(status) || !Number.isInteger(page) || page<0 || page>10000) return NextResponse.json({error:'Invalid filter'},{status:400});
    const {data,error,count}=await db.from('registration_profiles').select('*',{count:'exact'}).eq('status',status).order('created_at').order('user_id').range(page*25,page*25+24);
    if(error) throw error;
    return NextResponse.json({rows:data,total:count ?? 0},{headers:{'Cache-Control':'private, no-store'}});
  } catch {return NextResponse.json({error:'Registration queue is unavailable. Check configuration and migrations.'},{status:503});}
}
export async function POST(req:NextRequest) {
  const rejected=rejectUnsafeWorkspaceWrite(req);if(rejected)return rejected;
  try {
    const db:SupabaseClient=await createServerComponentClient();
    const {data:{user}}=await db.auth.getUser();
    if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
    const b=await req.json().catch(()=>null);
    if(!b || typeof b.userId!=='string' || !['approved','rejected'].includes(b.decision) || typeof b.reason!=='string' || !b.reason.trim() || b.reason.length>2000) return NextResponse.json({error:'A decision and reason are required'},{status:400});
    const {error}=await db.rpc('review_registration',{p_user_id:b.userId,p_decision:b.decision,p_reason:b.reason.trim()});
    if(error)return NextResponse.json({error:error.code==='42501'?'An independent active admin or manager must review this registration.':'This registration could not be reviewed. Refresh the queue and try again.'},{status:error.code==='42501'?403:409});
    return NextResponse.json({saved:true});
  } catch {return NextResponse.json({error:'Review service is unavailable'},{status:503});}
}
