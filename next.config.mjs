import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // Allows production verification to run alongside a local dev server without
  // both processes competing for the default `.next` directory.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  env: {
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      // Preserve older public image URLs using the existing local illustrations.
      { source: '/imgs/Our_Company_Image.png', destination: '/imgs/epr-compass/about-compass-story.png', permanent: true },
      { source: '/imgs/Our_Culture_Image.png', destination: '/imgs/epr-compass/about-renewable-landscape.png', permanent: true },
      { source: '/imgs/blog1.jpg', destination: '/imgs/blog-cpcb-registration.jpg', permanent: true },
      { source: '/imgs/blog2.jpg', destination: '/imgs/blog-what-is-epr.jpg', permanent: true },
      { source: '/imgs/blog3.jpg', destination: '/imgs/blog-pibo-recycler.jpg', permanent: true },
      { source: '/imgs/blog4.jpg', destination: '/imgs/blog-cpcb-registration.jpg', permanent: true },
      { source: '/imgs/blog5.jpg', destination: '/imgs/blog-epr-credits.jpg', permanent: true },
      // ── Recycler portal consolidation ─────────────────────────────────────────
      // /recycler/* → /recycler-portal/* (permanent, SEO-safe)
      { source: '/recycler/login',         destination: '/recycler-portal/login',        permanent: true },
      { source: '/recycler/dashboard',     destination: '/recycler-portal/dashboard',    permanent: true },
      { source: '/recycler/listings',      destination: '/recycler-portal/credits',      permanent: true },
      { source: '/recycler/filings',       destination: '/recycler-portal/tonnage',      permanent: true },
      { source: '/recycler/documents',     destination: '/recycler-portal/my-documents', permanent: true },
      { source: '/recycler/payments',      destination: '/recycler-portal/invoices',     permanent: true },
      { source: '/recycler/profile',       destination: '/recycler-portal/profile',      permanent: true },
      { source: '/recycler/contacts',      destination: '/recycler-portal/contacts',     permanent: true },
      { source: '/recycler/announcements', destination: '/recycler-portal/announcements',permanent: true },
      { source: '/recycler/help/:module*', destination: '/recycler-portal/dashboard',    permanent: true },
      { source: '/recycler',               destination: '/recycler-portal/dashboard',    permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
};

export default nextConfig;
