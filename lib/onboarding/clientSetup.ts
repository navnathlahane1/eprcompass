export const BUSINESS_ACTIVITIES = [
  { value: 'importer', label: 'Importer' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'both', label: 'Both' },
] as const;
export type BusinessActivity = typeof BUSINESS_ACTIVITIES[number]['value'];
export function isBusinessActivity(value: unknown): value is BusinessActivity {
  return BUSINESS_ACTIVITIES.some(option => option.value === value);
}
export const SETUP_CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'] as const;
export type ClientSetup = {
  business_activity: BusinessActivity;
  operating_countries: string[];
  product_categories: string[];
  imported_products: string;
  manufactured_products: string;
};
export function parseClientSetup(value: unknown, options: { draft?: boolean } = {}): ClientSetup {
  if (!value || typeof value !== 'object') throw new Error('Company setup is required');
  const body = value as Record<string, unknown>;
  if (!isBusinessActivity(body.business_activity)) throw new Error('Select Importer, Manufacturer, or Both');
  if (!Array.isArray(body.operating_countries) || (!options.draft && !body.operating_countries.length) || body.operating_countries.length > 100
    || body.operating_countries.some(country => typeof country !== 'string' || !country.trim() || country.length > 100)) {
    throw new Error('Enter at least one operating country');
  }
  if (!Array.isArray(body.product_categories) || (!options.draft && !body.product_categories.length)
    || body.product_categories.some(category => !SETUP_CATEGORIES.includes(category))) throw new Error('Select valid product categories');
  const text = (key: string, needed: boolean) => {
    if (!needed) return '';
    if (typeof body[key] !== 'string' || (!options.draft && !body[key].trim()) || body[key].length > 2000) throw new Error('Enter product details for each selected activity (maximum 2,000 characters)');
    return body[key].trim();
  };
  return {
    business_activity: body.business_activity,
    operating_countries: [...new Map(body.operating_countries.map(country => [country.trim().toLowerCase(), country.trim()])).values()],
    product_categories: [...new Set(body.product_categories)],
    imported_products: text('imported_products', body.business_activity !== 'manufacturer'),
    manufactured_products: text('manufactured_products', body.business_activity !== 'importer'),
  };
}

export function readClientSetup(value: unknown): Partial<ClientSetup> {
  const body = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const strings = (key: string) => Array.isArray(body[key]) ? body[key].filter((item): item is string => typeof item === 'string') : [];
  return {
    business_activity: isBusinessActivity(body.business_activity) ? body.business_activity : undefined,
    operating_countries: strings('operating_countries'),
    product_categories: strings('product_categories').filter(item => SETUP_CATEGORIES.some(category => category === item)),
    imported_products: typeof body.imported_products === 'string' ? body.imported_products : '',
    manufactured_products: typeof body.manufactured_products === 'string' ? body.manufactured_products : '',
  };
}
