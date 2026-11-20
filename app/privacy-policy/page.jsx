import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Privacy Policy | EPR Compass",
  description: "Global privacy policy for EPR Compass website, services, and communications.",
};

const sections = [
  {
    heading: "Scope and Data Controller",
    icon: "ShieldCheck",
    paragraphs: [
      "This Privacy Policy applies to EPR Compass and all related services, including training, consulting, marketplace, support, and communication workflows.",
      "For the purpose of applicable data protection laws, EPR Compass is the data controller for personal data collected directly through our platforms and interactions.",
    ],
  },
  {
    heading: "Personal Data We Collect",
    icon: "UserCheck",
    points: [
      "Identity and business profile data, including name, company, role, GST/registration details where required for services.",
      "Contact data such as email address, phone number, city/state, and communication preferences.",
      "Transaction and billing data including invoices, order history, payment status, and refund records.",
      "Service data including course progress, consulting notes, support requests, and onboarding/workflow status.",
      "Technical and usage data including device information, IP-derived location, browser type, and platform interaction logs.",
    ],
  },
  {
    heading: "Lawful Bases for Processing",
    icon: "Scale",
    points: [
      "Performance of contract: to deliver purchased training, consulting, and support services.",
      "Legitimate interests: to improve service quality, platform security, fraud prevention, and business analytics.",
      "Legal obligations: to comply with tax, accounting, regulatory, and dispute-handling requirements.",
      "Consent: for optional promotional communications and certain cookies/trackers where required by law.",
    ],
  },
  {
    heading: "How We Use Your Data",
    icon: "Database",
    points: [
      "To provide and administer services, including account management, learning delivery, and consulting execution.",
      "To process payments, refunds, and financial reconciliations through secure partners.",
      "To communicate operational updates, policy changes, invoices, and support responses.",
      "To measure performance, improve content and user experience, and maintain platform reliability.",
    ],
  },
  {
    heading: "Cookies, Analytics, and Marketing",
    icon: "Megaphone",
    points: [
      "We use necessary cookies for platform functionality and optional analytics/marketing tools to understand engagement and campaign effectiveness.",
      "Where legally required, optional trackers are used only with consent and can be withdrawn through browser or consent settings.",
      "You may opt out of promotional emails at any time using the unsubscribe link. Service communications may still be sent when necessary.",
    ],
  },
  {
    heading: "Chrome Extension (EPR Autofill)",
    icon: "Monitor",
    points: [
      "The EPR Autofill Chrome extension connects to your account using a personal access token you generate from Chrome Extension in the client portal — it does not use your email/password.",
      "When you use the extension on a supported government portal (currently CPCB's Common EPR Portal, epr.cpcb.gov.in), it reads the fields already stored in your Data Profile here (e.g. GSTIN, PAN, company name, contact details) to fill the matching fields on that page. By default it shows you a checklist of the resolved values before writing anything into the page, so you can review or exclude any field first.",
      "The extension only requests page access for CPCB government domains (*.cpcb.gov.in) and our own API domain (EPR Compass) — it cannot read or modify any other website you visit.",
      "The extension does not collect browsing history, does not run on any page besides the supported government portals, and does not share data with any third party. Autofill activity (which fields were filled, not their values) is recorded against your account on our servers, purely for your own audit trail.",
      "You can disconnect the extension at any time from its Settings page (sign out) or by revoking a device from Chrome Extension in the client portal — either immediately invalidates that token.",
    ],
  },
  {
    heading: "Sharing and International Transfers",
    icon: "Share2",
    points: [
      "We share personal data only with vetted service providers (for example payments, communication, hosting, analytics, and CRM) under contractual safeguards.",
      "We may disclose data to regulators, law enforcement, or courts when required by law.",
      "If data is transferred across jurisdictions, we use appropriate legal safeguards such as contractual clauses and security controls.",
      "We do not sell personal data and do not share personal data for third-party behavioral advertising without an appropriate legal basis.",
    ],
  },
  {
    heading: "Retention and Security",
    icon: "Lock",
    points: [
      "We retain personal data only for as long as needed for service delivery, legal compliance, dispute resolution, and legitimate business records.",
      "We implement administrative, technical, and organizational security controls appropriate to the risk profile of the data.",
      "No transmission or storage method is completely risk-free; however, we continuously monitor and improve security controls.",
    ],
  },
  {
    heading: "Your Privacy Rights",
    icon: "UserCheck",
    points: [
      "Subject to applicable law, you may request access, correction, deletion, portability, restriction, or objection to processing.",
      "You may withdraw consent where processing is consent-based, without affecting prior lawful processing.",
      "You may request closure of your account and deletion/anonymization of data not required for legal retention.",
      "You may lodge a complaint with the relevant supervisory or data protection authority in your jurisdiction.",
    ],
  },
  {
    heading: "Children's Privacy",
    icon: "ShieldAlert",
    paragraphs: [
      "Our services are designed for business and professional users and are not directed to children. We do not knowingly collect personal data from children where prohibited by law.",
    ],
  },
  {
    heading: "Policy Changes and Contact",
    icon: "Mail",
    points: [
      "We may update this policy periodically. Material updates will be posted on this page with a revised effective date.",
      "For privacy requests or complaints, please use the contact form on our website.",
      "To help us process requests efficiently, include your full name, registered email, and request details.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      icon="ShieldCheck"
      lastUpdated="July 15, 2026"
      intro="This policy explains how EPR Compass collects, uses, stores, shares, and safeguards personal data under globally recognized privacy principles."
      sections={sections}
    />
  );
}


