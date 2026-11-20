import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Terms & Conditions | EPR Compass",
  description: "Global terms governing use of EPR Compass website, products, and services.",
};

const sections = [
  {
    heading: "Acceptance and Eligibility",
    icon: "CheckCircle",
    paragraphs: [
      "By accessing our website or purchasing/using any EPR Compass service, you agree to these Terms & Conditions and related policies.",
      "You represent that you have authority to enter into these terms on behalf of yourself or the organization you represent.",
    ],
  },
  {
    heading: "Account Responsibilities",
    icon: "UserCheck",
    points: [
      "You are responsible for maintaining account credential confidentiality and all activities performed under your account.",
      "You must provide accurate and current information during registration, billing, and service onboarding.",
      "We may suspend access in case of suspected unauthorized use, fraud, or policy breach.",
    ],
  },
  {
    heading: "License and Intellectual Property",
    icon: "BookOpen",
    points: [
      "Unless expressly agreed otherwise, services and digital content are licensed (not sold) for your internal business or personal professional use.",
      "All platform code, content, templates, recordings, and training materials remain the intellectual property of EPR Compass or its licensors.",
      "You may not reproduce, resell, sublicense, publish, reverse engineer, or distribute protected content without prior written consent.",
      "Unauthorized usage may result in immediate suspension, access revocation, and legal remedies.",
    ],
  },
  {
    heading: "Payments and Access",
    icon: "CreditCard",
    points: [
      "Applicable pricing, taxes, billing cycle, and access duration are shown at checkout, proposal, or invoice stage.",
      "Payment must be completed as agreed to activate or continue paid services.",
      "We may update delivery format, session schedule, and supporting resources to maintain quality and regulatory relevance.",
    ],
  },
  {
    heading: "Acceptable Use",
    icon: "ListChecks",
    points: [
      "You must not use the platform for unlawful activity, infringement, abuse, security probing, or transmission of harmful code.",
      "You must not impersonate others, submit false identity information, or misrepresent compliance status.",
      "You must comply with all applicable laws and industry-specific regulatory requirements in your jurisdiction.",
    ],
  },
  {
    heading: "Service Scope and Professional Disclaimer",
    icon: "Briefcase",
    points: [
      "Our services are educational and operational support services and are not a substitute for independent legal, tax, or financial advice.",
      "Recommendations are based on information provided by you; accuracy and completeness of your data remain your responsibility.",
      "Regulatory outcomes depend on third-party and authority decisions beyond our control.",
    ],
  },
  {
    heading: "Third-Party Services",
    icon: "Share2",
    points: [
      "Our services may integrate with third-party tools (payment, messaging, analytics, or regulatory portals).",
      "Third-party services are governed by their own terms and privacy policies.",
      "We are not responsible for independent acts, outages, or policy changes of third-party providers.",
    ],
  },
  {
    heading: "Warranties and Liability",
    icon: "ShieldAlert",
    points: [
      "Services are provided on an 'as available' and 'as is' basis, except where non-waivable statutory warranties apply.",
      "To the extent permitted by law, we disclaim implied warranties including fitness for a particular purpose and non-infringement.",
      "To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages.",
      "Where liability cannot be excluded by law, liability is limited to the amount paid by you for the specific service giving rise to the claim.",
    ],
  },
  {
    heading: "Indemnity",
    icon: "ShieldCheck",
    paragraphs: [
      "You agree to indemnify and hold EPR Compass harmless from claims, losses, and expenses resulting from your misuse of services, legal violations, or rights infringement.",
    ],
  },
  {
    heading: "Suspension, Termination, and Force Majeure",
    icon: "XCircle",
    points: [
      "We may suspend or terminate access for policy breach, illegal conduct, non-payment, or security risk.",
      "We are not liable for delay or failure caused by events beyond reasonable control, including infrastructure outages, natural events, or regulatory disruptions.",
    ],
  },
  {
    heading: "Governing Law and Dispute Resolution",
    icon: "Scale",
    points: [
      "These terms are governed by applicable laws of India, unless otherwise required by mandatory consumer laws in your jurisdiction.",
      "Parties will first attempt good-faith resolution. If unresolved, disputes are subject to courts/tribunals with competent jurisdiction.",
    ],
  },
  {
    heading: "Policy Updates and Contact",
    icon: "Mail",
    points: [
      "We may revise these terms periodically. Updated terms become effective when published on this page.",
      "For contractual questions, please use the contact form on our website.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      icon="FileText"
      lastUpdated="April 21, 2026"
      intro="These terms govern your access to and use of EPR Compass websites, products, and services across jurisdictions."
      sections={sections}
    />
  );
}


