import fs from 'node:fs/promises';
import path from 'node:path';
import PagesDirectoryClient from './PagesDirectoryClient';

export const dynamic = 'force-dynamic';

const APP_DIR = path.join(process.cwd(), 'app');
const PAGE_FILES = new Set(['page.js', 'page.jsx', 'page.ts', 'page.tsx', 'page.mdx']);

function formatPageName(routePath) {
  if (routePath === '/') return 'Home';
  const last = routePath.split('/').filter(Boolean).pop() || '';
  return last
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function classifySection(routePath) {
  if (routePath.startsWith('/admin')) return 'Admin';
  if (routePath.startsWith('/portal') || routePath === '/dashboard') return 'Client Portal';
  if (routePath.startsWith('/privacy-policy') || routePath.startsWith('/terms-and-conditions') || routePath.startsWith('/refund-cancellation-policy') || routePath.startsWith('/shipping-delivery-policy') || routePath.startsWith('/results-earnings-disclaimer')) return 'Legal';
  return 'Public';
}

function classifyType(routePath) {
  return routePath.startsWith('/admin') || routePath.startsWith('/portal') || routePath === '/dashboard'
    ? 'Protected'
    : 'Public';
}

function classifyRole(routePath) {
  if (routePath.startsWith('/admin')) return 'admin / manager';
  if (routePath.startsWith('/portal') || routePath === '/dashboard') return 'client';
  return 'Anyone';
}

async function collectRoutes(dirAbsolutePath, routeSegments = []) {
  const entries = await fs.readdir(dirAbsolutePath, { withFileTypes: true });
  const pageEntries = [];

  const hasPageFile = entries.some((entry) => entry.isFile() && PAGE_FILES.has(entry.name));
  if (hasPageFile) {
    const routePath = routeSegments.length ? `/${routeSegments.join('/')}` : '/';
    pageEntries.push({
      section: classifySection(routePath),
      name: formatPageName(routePath),
      path: routePath,
      type: classifyType(routePath),
      role: classifyRole(routePath)
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const dirName = entry.name;

    // Skip non-page directories and dynamic segments.
    if (dirName === 'api' || dirName.startsWith('[') || dirName.includes('[') || dirName.startsWith('@') || dirName.startsWith('_')) {
      continue;
    }

    // Route groups do not appear in URL paths.
    const isRouteGroup = dirName.startsWith('(') && dirName.endsWith(')');
    const nextSegments = isRouteGroup ? routeSegments : [...routeSegments, dirName];

    const nested = await collectRoutes(path.join(dirAbsolutePath, dirName), nextSegments);
    pageEntries.push(...nested);
  }

  return pageEntries;
}

export default async function AdminPagesDirectoryPage() {
  // In production (Vercel), the source files may not be available at runtime.
  // Try multiple possible paths and fall back to empty list on any error.
  let pageDirectory = [];
  try {
    const dir = await fs.stat(APP_DIR).then(() => APP_DIR).catch(async () => {
      const alt = path.join(process.cwd(), 'frontend', 'app');
      await fs.stat(alt);
      return alt;
    });
    pageDirectory = await collectRoutes(dir);
  } catch {
    // Directory not accessible in this environment — render with empty list
  }
  pageDirectory.sort((a, b) => a.path.localeCompare(b.path));

  return <PagesDirectoryClient pageDirectory={pageDirectory} />;
}
