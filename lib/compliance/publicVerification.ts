export type PublicService = { waste_category: string; status: string; due_date: string | null };

// Service workflow states do not prove certificate validity or legal compliance.
export function publicStatus(rows: PublicService[], today = new Date().toISOString().slice(0, 10)) {
  if (!rows.length) return 'Not verified';
  if (rows.some(r => r.status === 'Overdue' ||
    (['Pending', 'In Progress'].includes(r.status) && r.due_date && r.due_date < today))) return 'Overdue';
  if (rows.some(r => ['Pending', 'In Progress'].includes(r.status))) return 'Pending';
  if (rows.some(r => !['Approved', 'Filed'].includes(r.status))) return 'Not verified';
  return 'Recorded filings';
}

export function publicVerification(rows: PublicService[]) {
  return {
    certificate_valid_until: null,
    last_compliance_date: null,
    waste_category_statuses: [...new Set(rows.map(r => r.waste_category))].map(category => ({
      waste_category: category, status: publicStatus(rows.filter(r => r.waste_category === category)),
    })),
  };
}
