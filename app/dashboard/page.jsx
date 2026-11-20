'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { finishSignIn } from '@/lib/auth/finishSignIn';

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function resolve() {
      // Wait for auth state — needed when arriving via magic link (token in URL hash)
      const { data: { session } } = await supabase.auth.getSession();

      if (!active) return;

      if (!session?.user) {
        // May still be loading token from hash — listen once
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          subscription.unsubscribe();
          if (!active) return;
          if (!newSession?.user) {
            router.replace('/login');
            return;
          }
          redirectByRole(newSession.user.id, newSession.user.email);
        });
        return;
      }

      redirectByRole(session.user.id, session.user.email);
    }

    async function redirectByRole() {
      if (!active) return;
      try {
        await finishSignIn();
      } catch {
        if (active) router.replace('/login');
      }
    }

    resolve();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        <p className="text-sm">Redirecting to your dashboard…</p>
      </div>
    </main>
  );
}
