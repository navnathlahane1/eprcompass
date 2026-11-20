export function reminderPeriod(cadence: string, now: Date): string | null {
  if (cadence === 'off') return null;
  const date = new Date(now);
  if (cadence === 'weekly') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return `${cadence === 'weekly' ? 'week' : 'day'}:${date.toISOString().slice(0,10)}`;
}
