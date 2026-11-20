import React from "react";

export const metadata = {
  title: "ELV EPR Playbook | EPR Compass",
  description: "Comprehensive ELV (End-of-Life Vehicle) EPR playbook: registration, certificate procurement, compliance, and best practices for auto sector entities.",
  alternates: { canonical: "/resources/elv-playbook" },
  openGraph: {
    title: "ELV EPR Playbook | EPR Compass",
    description: "Comprehensive ELV (End-of-Life Vehicle) EPR playbook: registration, certificate procurement, compliance, and best practices for auto sector entities.",
    url: "/resources/elv-playbook",
    type: "article",
  },
};

export default function ELVPlaybookPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">ELV EPR Playbook</h1>
      <p className="mb-6 text-lg">A practical guide for vehicle manufacturers, dismantlers, and recyclers to achieve ELV EPR compliance in India.</p>
      <ol className="list-decimal ml-6 space-y-2 text-base">
        <li><strong>Applicability & Registration:</strong> Assess ELV EPR applicability and complete CPCB/State portal registration.</li>
        <li><strong>Collection & Dismantling Chain:</strong> Set up authorized collection, dismantling, and recycling partners with traceability controls.</li>
        <li><strong>Certificate Procurement:</strong> Procure and reconcile ELV EPR certificates as per annual targets.</li>
        <li><strong>Compliance Reporting:</strong> Maintain records, prepare returns, and submit periodical compliance reports.</li>
        <li><strong>Audit Readiness:</strong> Ensure documentation, partner agreements, and evidence packs are audit-ready.</li>
      </ol>
      <div className="mt-8 p-4 bg-eco-green-1/30 dark:bg-eco-green-4/20 rounded">
        <strong>Need help with ELV EPR?</strong> Contact our experts for end-to-end ELV compliance support.
      </div>
    </main>
  );
}

