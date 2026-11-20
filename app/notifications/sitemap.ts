/**
 * /notifications/sitemap.ts
 * Dynamic sitemap for all active notifications
 * Registered in next.config.mjs as a sitemap source
 */

import type { MetadataRoute } from 'next';
import { createClient }       from '@supabase/supabase-js';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data } = await sb
    .from('scraped_notifications')
    .select('slug, updated_at, published_date, epr_type')
    .eq('status', 'active')
    .eq('is_deleted', false)
    .order('published_date', { ascending: false })
    .limit(5000);

  const baseUrl = 'http://localhost:3000';

  const entries: MetadataRoute.Sitemap = [
    {
      url:              `${baseUrl}/notifications`,
      lastModified:     new Date().toISOString(),
      changeFrequency:  'hourly',
      priority:         0.9,
    },
  ];

  for (const row of data || []) {
    entries.push({
      url:             `${baseUrl}/notifications/${row.slug}`,
      lastModified:    row.updated_at || row.published_date || new Date().toISOString(),
      changeFrequency: 'monthly',
      priority:        0.7,
    });
  }

  return entries;
}
