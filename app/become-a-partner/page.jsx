import BecomeAPartnerClient from "@/components/landing/BecomeAPartnerClient";

export const metadata = {
  title: "Become an EPR Compliance Partner | EPR Compass",
  description:
    "Join India's fastest-growing EPR compliance network. Earn 15-30% recurring commissions by referring businesses for EPR registration, certificates, and compliance management.",
  keywords:
    "EPR partner program, EPR compliance partner, EPR referral commissions, environmental compliance partnership, EPR consultant, CA firm EPR, PRO partnership",
  alternates: { canonical: "/become-a-partner" },
  openGraph: {
    title: "Become an EPR Compliance Partner | EPR Compass",
    description:
      "Earn recurring commissions by referring businesses for EPR registration and compliance. Free training, branded collateral, and a dedicated partner dashboard.",
    url: "/become-a-partner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Become an EPR Compliance Partner | EPR Compass",
    description:
      "Earn recurring commissions by referring businesses for EPR registration and compliance.",
  },
};

export default function BecomeAPartnerPage() {
  return <BecomeAPartnerClient />;
}

