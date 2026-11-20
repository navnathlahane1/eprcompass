import TenderingStub from '@/components/tendering/TenderingStub';

export default function DocumentsPage() {
  return (
    <TenderingStub
      title="Document Vault"
      description="Centralised repository for all tendering documents — NIT, corrigenda, bid submissions, award letters, and contracts — with version control."
      icon="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      accent="amber"
      features={[
        'Document upload categorised by tender and type',
        'Version history with change log for corrigenda',
        'Bulk download as ZIP per tender',
        'Document expiry tracking (EMD validity, bid validity)',
        'Access control — who can view which documents',
        'OCR-based full-text search across uploaded PDFs',
        'Automated document checklist per tender stage',
      ]}
    />
  );
}
