'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { TEAM_STORAGE_KEY, normalizeMembers, routeToModule } from '@/lib/admin/moduleAccess';

type Props = { children: React.ReactNode };

function isSuperAdmin(email?: string | null) {
  const list = String(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || '').trim().toLowerCase());
}

export default function AdminModuleAccessGate({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(true);

  const targetModule = useMemo(() => routeToModule(pathname || '/admin/dashboard'), [pathname]);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const {
          data: { user }
        } = await (supabase as any).auth.getUser();

        const email = String(user?.email || '').toLowerCase();
        if (!email) {
          if (active) {
            setAllowed(true);
            setReady(true);
          }
          return;
        }

        // Superadmin always has full access
        if (isSuperAdmin(email)) {
          if (active) {
            setAllowed(true);
            setReady(true);
          }
          return;
        }

        const raw = localStorage.getItem(TEAM_STORAGE_KEY);
        const members = normalizeMembers(raw ? JSON.parse(raw) : []);
        const member = members.find((m) => m.email === email);

        // No local Team mapping found: do not block to avoid accidental lockouts.
        // Also, team members with admin role always get full access regardless of stored module list.
        if (!member || member.role === 'admin') {
          if (active) {
            setAllowed(true);
            setReady(true);
          }
          return;
        }

        const canOpen = member.active && member.modules.includes(targetModule);
        if (active) {
          setAllowed(canOpen);
          setReady(true);
        }
      } catch {
        if (active) {
          setAllowed(true);
          setReady(true);
        }
      }
    }

    checkAccess();
    return () => {
      active = false;
    };
  }, [targetModule]);

  useEffect(() => {
    if (!ready) return;
    if (allowed) return;
    router.replace('/admin/dashboard');
  }, [ready, allowed, router]);

  if (!ready) {
    return <div className="p-6 text-sm text-gray-600">Loading access...</div>;
  }

  if (!allowed) {
    return <div className="p-6 text-sm text-red-700">Access restricted for this module.</div>;
  }

  return <>{children}</>;
}
