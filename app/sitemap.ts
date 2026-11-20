/**
 * /sitemap.ts
 * Root sitemap for all public, indexable pages.
 * Auth-gated portals (portal, recycler-portal, admin, dashboard, etc.) are
 * intentionally excluded — see app/robots.ts for the matching disallow list.
 * Dynamic notification pages have their own sitemap at /notifications/sitemap.xml.
 */

import type { MetadataRoute } from 'next';
import countries from '@/data/eprCountries.json';
import { getAllSlugs } from '@/lib/blogPosts';

export const revalidate = 3600;

const baseUrl = 'http://localhost:3000';

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
};

const STATIC_PAGES: Entry[] = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },

  // Core marketing / conversion pages
  { path: '/about-us', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/trust', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/verify', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/industries', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/who-is-it-for', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/compare', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/epr-calculator', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/epr-penalty-checker', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/compliance-checklist', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/waste-readiness-quiz', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/calculator', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/roi-calculator', changeFrequency: 'monthly', priority: 0.6 },

  // CEPC / partner network
  { path: '/become-a-cepc', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/become-a-partner', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/for-cepc', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/for-partners', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/for-recyclers', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-directory', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/recycler-connect', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/freelancer-network', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/freelancers', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/env-service-providers', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/global-coverage', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/get-matched', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/work-with-us', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/team', changeFrequency: 'monthly', priority: 0.4 },

  // join-network public landing pages (register/profile flows excluded)
  { path: '/join-network', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/join-network/consultants-marketplace', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/join-network/service-providers-directory', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/join-network/compliance-consultants', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/join-network/recyclers-pro-network', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/join-network/service-provider-programs', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/join-network/join-as-trainer', changeFrequency: 'monthly', priority: 0.5 },

  // Platform verticals
  { path: '/epr-platform', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/epr-client-workflow', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/epr-credit-trading', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/epr-countries', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/doctor-platform', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/ecovijay-platform', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/maritime-platform', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/marketplace', changeFrequency: 'weekly', priority: 0.5 },

  // Learning / community
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/resources', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/resources/pwm-rules-digest', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/resources/cpcb-update-alerts', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/resources/expert-faqs', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/resources/epr-playbooks', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/resources/client-case-studies', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/resources/elv-playbook', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/courses', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/training', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/trainings', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/training_calendar', changeFrequency: 'weekly', priority: 0.4 },
  { path: '/webinar', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/workshop-success', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/exhibition', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/students', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/interns', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/internship', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/women-empowerment', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/regulatory', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/notifications', changeFrequency: 'hourly', priority: 0.7 },

  // Legal / policy
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/refund-cancellation-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/shipping-delivery-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/results-earnings-disclaimer', changeFrequency: 'yearly', priority: 0.3 },

  // CEPC persona landing pages
  { path: '/cepc-for-ca-firms', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-company-secretaries', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-corporate-lawyers', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-ehs-consultants', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-environmental-lawyers', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-esg-consultants', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-fmcg-consultants', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-hr-and-ld', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-import-consultants', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-iso-auditors', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-pharma-consultants', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-startup-incubators', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-supply-chain-consultants', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-trade-associations', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/cepc-for-waste-management', changeFrequency: 'monthly', priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((entry) => ({
    url: `${baseUrl}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  const countryEntries: MetadataRoute.Sitemap = (countries as { slug: string }[]).map((c) => ({
    url: `${baseUrl}/epr/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const blogEntries: MetadataRoute.Sitemap = getAllSlugs().map(({ slug }: { slug: string }) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...countryEntries, ...blogEntries];
}
