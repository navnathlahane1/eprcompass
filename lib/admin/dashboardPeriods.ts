export function inCurrentFinancialYear<T extends { month: string }>(rows: T[], now = new Date()): T[] {
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return rows.filter(row => row.month >= `${year}-04` && row.month <= `${year + 1}-03`);
}
