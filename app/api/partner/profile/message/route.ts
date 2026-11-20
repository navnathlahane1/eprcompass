import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: partner } = await (supabase as any)
      .from('partners')
      .select('id, company_name, assigned_rm')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    if (!partner.assigned_rm) return NextResponse.json({ error: 'No RM assigned' }, { status: 400 });

    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const { error } = await (supabase as any)
      .from('notifications')
      .insert({
        profile_id: partner.assigned_rm,
        title: `Message from Partner: ${partner.company_name || 'Partner'}`,
        body: message.trim(),
        read: false,
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
