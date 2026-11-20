import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import WebSupportClient from './WebSupportClient';

export const metadata = { title: 'Web Support | Telecalling' };

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
    if (parsed?.access_token) return parsed.access_token;
  } catch {}
  return raw;
}

export default async function WebSupportPage() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const accessCookie = cookieStore.getAll().find(
    (c) => c.name.endsWith('-access-token') || c.name === 'sb-access-token' || c.name.endsWith('-auth-token')
  );
  const accessToken = tryParseToken(accessCookie?.value);
  if (!accessToken) redirect('/telecalling/login');

  const client = createClient(supabaseUrl, serviceRoleKey ?? anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  let agentName = 'Support Agent';
  try {
    const { data: { user } } = await client.auth.getUser(accessToken);
    if (user) {
      const { data: profile } = await client
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      agentName = profile?.full_name || user.email || 'Support Agent';
    }
  } catch {}

  // Fetch recent chats (most recent 50, ordered by last message)
  const { data: chats } = await client
    .from('support_chats')
    .select('id, visitor_name, visitor_email, portal, status, last_message_at, created_at, assigned_agent_id')
    .order('last_message_at', { ascending: false })
    .limit(50);

  // For each chat, fetch the last message for preview
  const chatIds = (chats || []).map((c: any) => c.id);
  let lastMessages: Record<string, string> = {};

  if (chatIds.length > 0) {
    // Fetch last message per chat using a single query (get all recent messages and take last per chat)
    const { data: msgs } = await client
      .from('support_messages')
      .select('chat_id, message, created_at')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: false })
      .limit(chatIds.length * 3); // get a few per chat max

    if (msgs) {
      const seen = new Set<string>();
      for (const m of msgs) {
        if (!seen.has(m.chat_id)) {
          lastMessages[m.chat_id] = m.message;
          seen.add(m.chat_id);
        }
      }
    }
  }

  const enrichedChats = (chats || []).map((c: any) => ({
    ...c,
    _lastMessage: lastMessages[c.id] || null,
    _unread: false,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Web Support</h1>
        <p className="text-sm text-slate-500">Live chat inbox — respond to visitors from all portals and login pages.</p>
      </div>
      <WebSupportClient agentName={agentName} initialChats={enrichedChats} />
    </div>
  );
}
