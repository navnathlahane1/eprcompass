import { toolsMenu, partnerLinks, marketplaceLinks, learnCountryLinks } from './data';

export function matchesNavPath(pathname, href) {
  return Boolean(pathname && (pathname === href || pathname.startsWith(`${href}/`)));
}

export function activeNavSection(pathname) {
  const groups = {
    platform: ['/services', '/industries'],
    tools: toolsMenu.map(({ href }) => href),
    marketplace: ['/marketplace', ...marketplaceLinks.map(({ href }) => href)],
    learn: ['/courses', '/trainings', '/training_calendar', '/resources', '/epr', ...learnCountryLinks.map(({ href }) => href)],
    partners: [...partnerLinks.map(({ href }) => href), '/work-with-us'],
  };
  return Object.keys(groups).find((group) => groups[group].some((href) => matchesNavPath(pathname, href))) ?? null;
}
