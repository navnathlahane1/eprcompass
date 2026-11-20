'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function AdminContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Legacy modules own dark surfaces; keep their text and controls legible during navigation.
  const overview = pathname === '/admin/dashboard' || pathname === '/admin';
  return (
    <main id="admin-content" tabIndex={-1} className={`min-w-0 flex-1 overflow-y-auto outline-none ${overview ? 'bg-zinc-50 text-zinc-900' : 'dark bg-[#020817] text-slate-100'}`}>
      <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
    </main>
  );
}
