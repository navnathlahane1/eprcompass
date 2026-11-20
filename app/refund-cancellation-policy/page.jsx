import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Refund & Cancellation Policy | EPR Compass",
  description: "Global refund and cancellation policy for EPR Compass products and services.",
};

const sections = [
  {
    heading: "Policy Scope",
    icon: "FileText",
    paragraphs: [
      "This policy applies to paid digital courses, workshops, consulting engagements, and related service plans sold by EPR Compass.",
      "Some services may have custom commercial terms in proposals or contracts. In case of conflict, signed contract terms prevail for that engagement.",
    ],
  },
  {
    heading: "Consumer Rights and Statutory Protection",
    icon: "Scale",
    points: [
      "Nothing in this policy limits non-waivable rights available to consumers under applicable law.",
      "Where local law provides mandatory cancellation or refund rights, those rights apply in addition to this policy.",
    ],
  },
  {
    heading: "Digital Courses and Workshops",
    icon: "Clock",
    points: [
      "If immediate access to digital content is granted, purchases are generally non-refundable after access starts, except where required by law.",
      "If you have not accessed the course/workshop content, you may request cancellation within 7 calendar days of purchase.",
      "If a live cohort is rescheduled by us, you may choose transfer to another cohort or request a refund where legally applicable.",
      "Duplicate or excess payments are eligible for full reversal after payment verification.",
    ],
  },
  {
    heading: "Consulting and Service Packages",
    icon: "Briefcase",
    points: [
      "No refund is available once substantial course content is accessed, downloaded, or consumed.",
      "For live cohorts, no refund is available once the first live session has started.",
      "For milestone-based services, fees for completed milestones, consumed consulting hours, or delivered artifacts are non-refundable.",
      "Cancellation requested before service initiation may be eligible for partial refund after deducting payment gateway and administrative charges.",
      "No refund is available for delays, rework, or outcome impact caused by incomplete/inaccurate client inputs or delayed approvals.",
    ],
  },
  {
    heading: "Cancellation by EPR Compass",
    icon: "XCircle",
    points: [
      "We may cancel/refuse service in case of fraud risk, legal non-compliance, abuse, or inability to deliver due to force majeure circumstances.",
      "If a service is canceled by us before meaningful delivery begins, eligible amounts are refunded to the original payment method.",
    ],
  },
  {
    heading: "How to Request Cancellation or Refund",
    icon: "Mail",
    points: [
      "Send your request using the contact form on our website and include your registered email address.",
      "Include full name, registered contact details, order/invoice number, payment proof, and reason for request.",
      "Requests may be declined if mandatory details are missing or timelines under this policy are not met.",
    ],
  },
  {
    heading: "Refund Processing Timelines",
    icon: "Clock",
    points: [
      "Eligible requests are reviewed within 5 business days.",
      "Approved refunds are initiated to the original payment method and typically settled within 7-14 business days (bank/payment network dependent).",
      "Any foreign exchange differences, intermediary fees, or card issuer deductions are outside our control.",
    ],
  },
  {
    heading: "Chargebacks and Payment Disputes",
    icon: "AlertCircle",
    paragraphs: [
      "If a chargeback is raised without first using the refund process above, we may suspend associated services while the dispute is investigated.",
    ],
  },
];

export default function RefundCancellationPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund & Cancellation Policy"
      icon="RotateCcw"
      lastUpdated="April 21, 2026"
      intro="This policy explains when cancellations and refunds are available for EPR Compass products and services."
      sections={sections}
    />
  );
}


