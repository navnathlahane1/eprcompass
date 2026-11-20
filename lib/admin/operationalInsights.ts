export function operationalInsights(context: any) {
  const alerts = context?.topAlerts || {};
  const rows: { type: 'risk' | 'alert' | 'trend'; priority: 1 | 2 | 3; title: string; detail: string; action: string }[] = [];
  const checks = [
    ['overdueFilings', 'Overdue filings', 'Review overdue filings and confirm their recorded status.'],
    ['deadlines30d', 'Upcoming deadlines', 'Review the next 30 days and assign filing owners.'],
    ['overdueInvoices', 'Outstanding invoices', 'Reconcile recorded balances with the finance team.'],
    ['highRiskRecyclers', 'Recycler risk review', 'Review flagged recycler records and supporting evidence.'],
  ];
  for (const [key, title, action] of checks) {
    const value = Number(alerts[key]);
    if (Number.isFinite(value) && value > 0) rows.push({
      type: key === 'highRiskRecyclers' ? 'risk' : 'alert', priority: 1, title,
      detail: `${value.toLocaleString('en-IN')} recorded in the current dashboard snapshot.`, action,
    });
  }
  if (!rows.length) rows.push({ type: 'trend', priority: 3, title: 'Review dashboard records', detail: 'No positive alert figures were provided. This does not establish compliance or data completeness.', action: 'Confirm the reporting period and validate source records.' });
  return rows;
}
