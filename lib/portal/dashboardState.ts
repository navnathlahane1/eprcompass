export function dashboardBaseline(input: { scheduled: number; targets: number; failed: boolean }) {
  if (input.failed) return 'unavailable';
  return input.scheduled > 0 || input.targets > 0 ? 'recorded' : 'unassessed';
}
