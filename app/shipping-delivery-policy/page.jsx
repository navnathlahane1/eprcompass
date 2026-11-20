import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Shipping & Delivery Policy | EPR Compass",
  description: "Digital fulfillment and delivery policy for EPR Compass services.",
};

const sections = [
  {
    heading: "Digital-First Fulfillment",
    icon: "Package",
    points: [
      "EPR Compass primarily delivers digital services, including online learning, consulting sessions, compliance resources, reports, and support artifacts.",
      "Unless explicitly mentioned at checkout or in a contract, no physical shipment is involved.",
    ],
  },
  {
    heading: "Access and Delivery Timelines",
    icon: "Clock",
    points: [
      "Digital course access is usually activated immediately or within a few hours after successful payment confirmation.",
      "Live training/workshop/consulting schedules are communicated by email, messaging, or platform notifications.",
      "Project-based consulting deliverables are provided according to agreed milestones and required client-side dependencies.",
    ],
  },
  {
    heading: "Delivery Channels and Responsibility",
    icon: "Mail",
    points: [
      "Delivery communication may be sent via registered email, messaging channels, phone, and account dashboard notifications.",
      "You are responsible for maintaining accurate contact details and allowing required domains/channels.",
      "Failure to receive notifications due to incorrect contact details, spam filters, or enterprise firewalls does not constitute non-delivery by us.",
    ],
  },
  {
    heading: "Technical Prerequisites",
    icon: "Laptop",
    points: [
      "You are responsible for maintaining compatible hardware, software, browser, and internet connectivity for digital access.",
      "Platform availability may depend on third-party infrastructure and regional network conditions.",
    ],
  },
  {
    heading: "Delays, Interruptions, and Exceptions",
    icon: "AlertTriangle",
    points: [
      "Delays may occur due to payment verification, infrastructure outages, force majeure events, or incomplete client-side documentation.",
      "We are not liable for delays caused by third-party providers, authorities, or user-side technical and operational failures.",
    ],
  },
  {
    heading: "Physical Shipping and Charges",
    icon: "Truck",
    paragraphs: [
      "As services are predominantly digital, shipping charges generally do not apply. If physical documents/materials are offered, delivery fees, geography limits, and ETA are disclosed before order confirmation.",
    ],
  },
  {
    heading: "Undelivered Access Support",
    icon: "LifeBuoy",
    points: [
      "If paid access is not delivered within the expected timeframe, use the contact form on our website and include your payment and account details.",
      "We will verify transaction and provision access or provide next-step resolution under applicable policy terms.",
    ],
  },
];

export default function ShippingDeliveryPolicyPage() {
  return (
    <LegalPageLayout
      title="Shipping & Delivery Policy"
      icon="Truck"
      lastUpdated="April 21, 2026"
      intro="This policy explains digital service delivery, timelines, and fulfillment responsibilities for EPR Compass offerings."
      sections={sections}
    />
  );
}


