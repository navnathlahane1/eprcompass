export const CATEGORY_CREDIT_TYPES: Record<string, string[]> = {
  Plastic: ['CAT1', 'CAT2', 'CAT3', 'CAT4', 'EOL'],
  'E-Waste': ['Metals'],
  Battery: ['Metals'],
  Tyre: ['Metals'],
  Oil: ['Metals']
};

export function getAllowedCreditTypes(category: string): string[] {
  return CATEGORY_CREDIT_TYPES[category] || ['Metals'];
}

export function normalizeCreditType(category: string, creditType?: string | null): string {
  const allowed = getAllowedCreditTypes(category);
  const normalized = String(creditType || '').trim();
  return allowed.includes(normalized) ? normalized : allowed[0];
}
