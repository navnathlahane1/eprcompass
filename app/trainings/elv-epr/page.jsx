import React from "react";

export const metadata = {
  title: "ELV EPR Training | EPR Compass",
  description: "Training and workshops for ELV (End-of-Life Vehicle) EPR compliance: registration, certificate management, and audit readiness for auto sector entities.",
  alternates: { canonical: "/trainings/elv-epr" },
  openGraph: {
    title: "ELV EPR Training | EPR Compass",
    description: "Training and workshops for ELV (End-of-Life Vehicle) EPR compliance: registration, certificate management, and audit readiness for auto sector entities.",
    url: "/trainings/elv-epr",
    type: "article",
  },
};

export default function ELVTrainingPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">ELV EPR Training & Workshops</h1>
      <p className="mb-6 text-lg">Expert-led training for vehicle manufacturers, dismantlers, and recyclers to master ELV EPR compliance.</p>
      <ul className="list-disc ml-6 space-y-2 text-base">
        <li>ELV EPR rules, applicability, and registration process</li>
        <li>Certificate procurement and reconciliation workflows</li>
        <li>Partner due diligence and traceability controls</li>
        <li>Compliance reporting and audit readiness</li>
        <li>Live Q&A and case studies</li>
      </ul>
      <div className="mt-8 p-4 bg-eco-green-1/30 dark:bg-eco-green-4/20 rounded">
        <strong>Interested in ELV EPR training?</strong> Contact us to schedule a session for your team.
      </div>
    </main>
  );
}

