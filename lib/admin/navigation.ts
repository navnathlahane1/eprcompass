type NavigationItem = { id: string; href: string };

export function activeNavigationId(pathname: string, search: string, items: NavigationItem[]) {
  const query = new URLSearchParams(search);
  let active: string | undefined;
  let best = -1;
  for (const item of items) {
    const [base, filter] = item.href.split('?');
    if (pathname !== base && !pathname.startsWith(`${base}/`)) continue;
    const required = new URLSearchParams(filter);
    if ([...required].some(([key, value]) => query.get(key) !== value)) continue;
    const score = base.length + [...required].length;
    if (score > best) { active = item.id; best = score; }
  }
  return active;
}
