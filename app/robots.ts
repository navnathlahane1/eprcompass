/**
 * /robots.ts
 * Disallow list mirrors middleware.ts auth-gated prefixes plus other
 * functional/transactional routes with no SEO value (login, checkout,
 * short-links, payment pages). Everything else stays crawlable.
 */

import type { MetadataRoute } from 'next';

const baseUrl = 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Auth-gated internal portals (mirrors middleware.ts matcher + legal-portal's own gate)
        '/admin',
        '/intel',
        '/iam',
        '/finance',
        '/comms',
        '/portal',
        '/partner',
        '/cepc/',
        '/recycler/',
        '/recycler-portal',
        '/telecalling',
        '/manager',
        '/taskmanager',
        '/academy',
        '/tendering',
        '/knowledge',
        '/ops',
        '/legal-portal',

        // Functional / transactional, no SEO value
        '/dashboard',
        '/checkout',
        '/auth/',
        '/onboarding/',
        '/login',
        '/r/',
        '/t/',
        '/pay/',
        '/api/',
        '/unauthorized',
        '/join-network/register/',
        '/join-network/profile/',
        '/marketplace/listings',
        '/marketplace/requirements',
        '/marketplace/transactions',
        '/marketplace/price-history',
      ],
    },
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/notifications/sitemap.xml`],
  };
}
