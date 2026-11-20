export const CATEGORY_CREDIT_TYPES = {
  Plastic: ['CAT1', 'CAT2', 'CAT3', 'CAT4', 'EOL'],
  'E-Waste': ['Metals'],
  Battery: ['Metals'],
  Tyre: ['Metals'],
  Oil: ['Metals']
};

export function getAllowedCreditTypes(category) {
  return CATEGORY_CREDIT_TYPES[category] || ['Metals'];
}

export function normalizeCreditType(category, creditType) {
  const allowed = getAllowedCreditTypes(category);
  const normalized = String(creditType || '').trim();
  return allowed.includes(normalized) ? normalized : allowed[0];
}
