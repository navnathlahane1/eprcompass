import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Results / Earnings Disclaimer | EPR Compass",
  description: "Global disclaimer clarifying limits of guarantees, projections, and outcome claims.",
};

const sections = [
  {
    heading: "No Guarantee of Results or Earnings",
    icon: "Ban",
    paragraphs: [
      "All training, templates, and consulting frameworks are provided for educational and operational guidance purposes only.",
      "We do not guarantee specific revenue, profit, savings, registrations, certifications, approvals, or regulatory outcomes.",
    ],
  },
  {
    heading: "Outcome Variability Factors",
    icon: "ListChecks",
    points: [
      "Execution quality, process discipline, and internal governance of your organization.",
      "Accuracy, timeliness, and completeness of information and documents submitted by you.",
      "Market dynamics, regulatory interpretation, authority timelines, and third-party dependencies.",
      "Operational constraints, staffing, budgets, and external events beyond our control.",
    ],
  },
  {
    heading: "No Professional Advice Relationship",
    icon: "Scale",
    paragraphs: [
      "Unless explicitly stated in a signed engagement, our content is not legal, tax, accounting, audit, investment, or other regulated professional advice.",
      "You should obtain independent professional advice before taking decisions with legal, tax, financial, or regulatory consequences.",
    ],
  },
  {
    heading: "Testimonials and Case Studies",
    icon: "MessageSquare",
    points: [
      "Testimonials, case studies, or examples shown on our platforms reflect individual experiences and are illustrative only.",
      "They do not represent average outcomes and should not be interpreted as a promise or guarantee of similar results.",
    ],
  },
  {
    heading: "Third-Party Information",
    icon: "Share2",
    points: [
      "Our content may reference third-party tools, regulators, portals, or partner services.",
      "We do not control and are not responsible for third-party content accuracy, availability, policy changes, or decisions.",
    ],
  },
  {
    heading: "Limitation of Reliance and Liability",
    icon: "ShieldAlert",
    paragraphs: [
      "By using our services, you acknowledge that reliance on any strategy or recommendation is at your own risk and business judgment.",
      "To the extent permitted by law, EPR Compass disclaims liability for indirect or consequential losses arising from use of our materials or services.",
    ],
  },
  {
    heading: "Contact for Clarification",
    icon: "Mail",
    paragraphs: [
      "For questions about claims, estimates, or program scope, use the contact form on our website before purchase or implementation.",
    ],
  },
];

export default function ResultsEarningsDisclaimerPage() {
  return (
    <LegalPageLayout
      title="Results / Earnings Disclaimer"
      icon="AlertTriangle"
      lastUpdated="April 21, 2026"
      intro="This disclaimer applies to all training, resources, communications, and consulting services delivered by EPR Compass."
      sections={sections}
    />
  );
}


