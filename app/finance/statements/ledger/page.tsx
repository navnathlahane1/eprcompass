import ModuleStub from '@/components/finance/ModuleStub';

export default function LedgerPage() {
  return (
    <ModuleStub
      title="General Ledger"
      description="Complete chart of accounts, journal entries, and ledger-level transaction history with drill-down capability."
      icon="M4 6h16M4 10h16M4 14h16M4 18h16"
      accent="violet"
      features={[
        'Chart of accounts with debit/credit classification',
        'Journal entry creation and approval workflow',
        'Ledger account view with opening/closing balance',
        'Trial balance auto-generated from journal entries',
        'Reconciliation status per account',
        'Tally XML / CSV export for CA handoff',
      ]}
    />
  );
}
