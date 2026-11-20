'use client';

/**
 * Client shell that provides the global toast stack for the admin layout.
 *
 * Why a separate wrapper:
 *   admin/layout.tsx is a Server Component (uses cookies/headers/redirect).
 *   Server Components cannot call createContext or useState.
 *   This thin client boundary re-exports children unchanged but wraps them
 *   in <ToastProvider> so any child page can call useToast().
 */

import { ToastProvider } from '@/lib/toast/ToastContext';
import { Toaster } from '@/components/Toaster';
import type { ReactNode } from 'react';

export function AdminToastWrapper({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  );
}
