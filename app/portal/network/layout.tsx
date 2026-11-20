import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import Link from 'next/link';
import { Network, MapPin, FileText, Building2 } from 'lucide-react';

const NETWORK_NAV = [
  { label: 'Recyclers',  href: '/portal/network/recyclers',  icon: Network },
  { label: 'Map',        href: '/portal/network/map',        icon: MapPin },
  { label: 'Contracts',  href: '/portal/network/contracts',  icon: FileText },
  { label: 'PROs',       href: '/portal/network/pros',       icon: Building2 },
];

export default async function NetworkLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Feature gate check
  if (!FEATURE_FLAGS.RECYCLER_NETWORK_ENABLED) redirect('/portal/dashboard');

  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: flag } = await (db as any)
    .from('client_feature_flags')
    .select('enabled')
    .eq('client_id', user.id)
    .eq('feature', 'recyclerNetwork')
    .maybeSingle();

  if (!flag?.enabled) redirect('/portal/dashboard');

  return (
    <div className="space-y-4">
      {/* Sub-navigation tabs */}
      <nav
        className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        aria-label="Recycler Network sections"
      >
        {NETWORK_NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-eco-green-5 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
