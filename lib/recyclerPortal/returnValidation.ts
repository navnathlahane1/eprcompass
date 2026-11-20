export function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function validReturnPeriod(from: unknown, to: unknown) {
  return validDate(from) && validDate(to) && from <= to;
}

export function validReturnQuantity(value: unknown) {
  return value == null || value === '' || ((typeof value === 'number' || typeof value === 'string')
    && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0);
}
