import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact EPR Compass — CPCB EPR Registration and Certificate Help",
  description:
    "Talk to an EPR consultant for CPCB registration, EPR certificates, plastic / e-waste / battery filings and annual returns in India.",
  keywords: "EPR consultant India, CPCB EPR help, EPR certificate support, contact EPR Compass",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

