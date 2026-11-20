'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminPathToHelpModule, portalPathToHelpModule } from '@/lib/instructions/modules';

export default function CurrentModuleHelpLink({ area }: { area: 'admin' | 'portal' }) {
  const pathname = usePathname();

  const moduleSlug = area === 'admin'
    ? adminPathToHelpModule(pathname || '/admin/dashboard')
    : portalPathToHelpModule(pathname || '/portal/dashboard');

  const href = area === 'admin' ? `/admin/help/${moduleSlug}` : `/portal/help/${moduleSlug}`;

  return (
    <div className="mb-3 flex justify-end">
      <Link
        href={href}
        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
      >
        How This Module Works
      </Link>
    </div>
  );
}
