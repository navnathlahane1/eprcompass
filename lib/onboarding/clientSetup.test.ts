import { describe, expect, it } from 'vitest';
import { parseClientSetup, readClientSetup } from './clientSetup';

const valid = { business_activity: 'both', operating_countries: [' India ', 'india', 'Germany'], product_categories: ['Plastic'], imported_products: 'Packaged equipment', manufactured_products: 'Batteries' };
describe('client onboarding', () => {
  it('allows empty draft details but requires them for completion', () => {
    const draft = { ...valid, operating_countries: [], product_categories: [], imported_products: '', manufactured_products: '' };
    expect(parseClientSetup(draft, { draft: true })).toEqual(draft);
    expect(() => parseClientSetup(draft)).toThrow();
  });
  it('still rejects invalid values in drafts', () => {
    expect(() => parseClientSetup({ ...valid, business_activity: 'enterprise' }, { draft: true })).toThrow();
    expect(() => parseClientSetup({ ...valid, imported_products: 'a'.repeat(2001) }, { draft: true })).toThrow();
    expect(() => parseClientSetup({ ...valid, product_categories: ['unknown'] }, { draft: true })).toThrow();
  });
  it('loads malformed stored fields without passing objects to form controls', () => {
    expect(readClientSetup({ business_activity: 'unknown', operating_countries: 'India', product_categories: ['Plastic', {}, 'unknown'], imported_products: {}, manufactured_products: null }))
      .toEqual({ business_activity: undefined, operating_countries: [], product_categories: ['Plastic'], imported_products: '', manufactured_products: '' });
    expect(readClientSetup(null).operating_countries).toEqual([]);
  });
  it('stores both activities and normalizes duplicate countries', () => {
    expect(parseClientSetup(valid)).toEqual({ ...valid, operating_countries: ['india', 'Germany'] });
  });
  it('clears details that no longer apply to a single activity', () => {
    expect(parseClientSetup({ ...valid, business_activity: 'importer' }).manufactured_products).toBe('');
    expect(parseClientSetup({ ...valid, business_activity: 'manufacturer' }).imported_products).toBe('');
  });
  it.each([
    { business_activity: 'starter' }, { business_activity: '' }, { operating_countries: [] },
    { operating_countries: [123] }, { product_categories: ['invalid'] }, { product_categories: [] },
    { imported_products: '' }, { manufactured_products: '' }, { imported_products: 'a'.repeat(2001) },
  ])('rejects invalid setup %j', change => { expect(() => parseClientSetup({ ...valid, ...change })).toThrow(); });
  it('does not accept subscription or tenant identifiers as setup fields', () => {
    expect(parseClientSetup({ ...valid, clientId: 'other', plan_code: 'enterprise' })).not.toHaveProperty('plan_code');
    expect(parseClientSetup({ ...valid, clientId: 'other' })).not.toHaveProperty('clientId');
  });
});
