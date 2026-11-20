import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function GET() {
  const db: SupabaseClient = await createServerComponentClient();
  const {data:{user}} = await db.auth.getUser();
  if (!user) return NextResponse.json({error:'Sign in required'}, {status:401});
  const {data,error} = await db.from('service_reminder_preferences').select('cadence').eq('user_id',user.id).maybeSingle();
  if (error) return NextResponse.json({error:'Reminder preferences are unavailable'}, {status:503});
  return NextResponse.json({cadence:data?.cadence ?? 'daily'}, {headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req); if (rejected) return rejected;
  const db: SupabaseClient = await createServerComponentClient();
  const {data:{user}} = await db.auth.getUser();
  if (!user) return NextResponse.json({error:'Sign in required'}, {status:401});
  const body = await req.json().catch(() => null);
  if (!['daily','weekly','off'].includes(body?.cadence)) return NextResponse.json({error:'Invalid reminder frequency'}, {status:400});
  const {error} = await db.from('service_reminder_preferences').upsert({user_id:user.id,cadence:body.cadence});
  if (error) return NextResponse.json({error:'Unable to save preferences'}, {status:503});
  return NextResponse.json({saved:true});
}
