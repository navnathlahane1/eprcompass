import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import ImportWizardClient from './ImportWizardClient';

export const metadata = { title: 'Import Leads' };

export default function LeadImportPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="leads" />
      <ImportWizardClient />
    </div>
  );
}
