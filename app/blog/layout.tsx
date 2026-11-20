import type { Metadata } from "next";

const SITE_URL = "http://localhost:3000";

export const metadata: Metadata = {
  title: "EPR Blog: Extended Producer Responsibility Guides for India",
  description:
    "Practical EPR guides for Indian PIBOs: CPCB registration, plastic waste management, e-waste and battery EPR, certificates, credits, penalties and PWM Rules.",
  keywords:
    "EPR, Extended Producer Responsibility, EPR certificate, CPCB EPR registration, plastic waste management, PWM Rules, e-waste EPR, battery EPR, EPR credits, PIBO",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "EPR Blog | EPR Compass",
    description:
      "Guides on EPR in India: CPCB portal, certificates, PWM Rules, e-waste, battery waste and environmental compensation.",
    url: `${SITE_URL}/blog`,
    siteName: "EPR Compass",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "EPR Blog | EPR Compass",
    description:
      "Guides on Extended Producer Responsibility in India for producers, importers and brand owners.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}

