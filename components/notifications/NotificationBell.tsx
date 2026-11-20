'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Row = {
  id: string;
  type: string;
  message: string;
  created_at: string;
  read: boolean;
  link: string | null;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  const unreadCount = useMemo(() => rows.filter((r) => !r.read).length, [rows]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const {
        data: { user }
      } = await (supabase as any).auth.getUser();
      if (!user || !active) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data } = await (supabase as any)
        .from('notifications')
        .select('id, type, message, created_at, read, link')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (active) {
        setRows(data || []);
        setLoading(false);
      }
    }

    load();

    const channel = (supabase as any)
      .channel('notification-bell-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      active = false;
      (supabase as any).removeChannel(channel);
    };
  }, []);

  async function markAllRead() {
    const unread = rows.filter((r) => !r.read).map((r) => r.id);
    if (!unread.length) return;
    await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .in('id', unread);

    setRows((prev) => prev.map((r) => (r.read ? r : { ...r, read: true })));
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((p) => !p)}
        className="relative rounded-full border border-gray-300 bg-white p-2 hover:bg-gray-50"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:underline">Mark all read</button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? <p className="p-3 text-sm text-gray-500">Loading...</p> : null}
            {!loading && rows.length === 0 ? <p className="p-3 text-sm text-gray-500">No notifications</p> : null}
            {!loading && rows.map((row) => (
              <div key={row.id} className={`border-b border-gray-100 p-3 text-sm ${row.read ? 'bg-white' : 'bg-blue-50/40'}`}>
                <p className="font-semibold text-gray-900">{row.type.toUpperCase()}</p>
                <p className="mt-1 text-gray-700">{row.message}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(row.created_at).toLocaleString()}</span>
                  {row.link ? <Link href={row.link} className="font-medium text-blue-600 hover:underline">Open</Link> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
