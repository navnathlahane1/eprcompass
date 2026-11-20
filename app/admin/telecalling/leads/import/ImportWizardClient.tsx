'use client';

import LeadImportWizard from '@/components/telecalling/LeadImportWizard';

export default function ImportWizardClient() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-100">Import Leads</h1>
        <p className="text-sm text-slate-500 mt-1">Upload a CSV or Excel file to import leads. DNC check and dedup are automatic.</p>
      </div>
      <LeadImportWizard />
    </div>
  );
}
