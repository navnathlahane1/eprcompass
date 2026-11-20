import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: partner } = await (supabase as any)
      .from('partners').select('id').eq('profile_id', user.id).maybeSingle();
    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    const body = await req.json();
    const allowed = ['phone', 'city', 'state', 'address_line1', 'address_line2', 'pincode'];
    const updates: Record<string, string> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { error } = await (supabase as any)
      .from('partners')
      .update(updates)
      .eq('id', partner.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
