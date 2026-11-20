import { describe, expect, it } from 'vitest';
import { activeNavSection, matchesNavPath } from './activeSection';
import { toolsMenu, partnerLinks, marketplaceLinks, learnCountryLinks } from './data';

describe('public navigation', () => {
  it.each([
    ['/services/importer-epr-registration', 'platform'],
    ['/industries/electronics-eee', 'platform'],
    ['/epr-credit-trading', 'marketplace'],
    ['/join-network/join-as-trainer', 'partners'],
    ['/training_calendar', 'learn'],
    ['/epr/germany', 'learn'],
    ['/pricing', null],
    ['/signup', null],
    ['/login', null],
    ['/epr-calculator-other', null],
  ])('selects the same group on desktop and mobile for %s', (path, expected) => {
    expect(activeNavSection(path)).toBe(expected);
  });

  it('covers every listed tool, partner, marketplace and country link', () => {
    for (const [section, links] of Object.entries({ tools: toolsMenu, partners: partnerLinks, marketplace: marketplaceLinks, learn: learnCountryLinks })) {
      for (const { href } of links) expect(activeNavSection(href)).toBe(section);
    }
  });

  it('matches route segments without matching similarly named pages', () => {
    expect(matchesNavPath('/verify/123', '/verify')).toBe(true);
    expect(matchesNavPath('/verification', '/verify')).toBe(false);
    expect(matchesNavPath(null, '/verify')).toBe(false);
  });
});
