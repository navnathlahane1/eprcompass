import ComplianceChecklist from "@/components/ComplianceChecklist";

export const metadata = {
  title: "EPR Compliance Checklist — Step-by-Step Guide | EPR Compass",
  description:
    "Interactive EPR compliance checklist covering registration, documentation, target fulfillment, annual filing, and audit readiness. Track your progress step-by-step.",
  keywords:
    "EPR compliance checklist, EPR registration steps, EPR filing checklist, CPCB compliance guide, EPR audit preparation India",
  alternates: { canonical: "/compliance-checklist" },
  openGraph: {
    title: "EPR Compliance Checklist — Step-by-Step Guide | EPR Compass",
    description: "Interactive EPR compliance checklist. Track your registration, filing, and audit readiness progress.",
    url: "/compliance-checklist",
    type: "website",
  },
};

export default function ComplianceChecklistPage() {
  return <ComplianceChecklist />;
}

