import BecomeACEPCClient from "@/components/landing/BecomeACEPCClient";

export const metadata = {
  title: "Become a Certified EPR Professional Consultant (CEPC) | EPR Compass",
  description:
    "Get CEPC certified and build a lucrative EPR compliance consulting practice. 60-hour training, all waste categories, earn ₹50K–₹2L+ per month.",
  keywords:
    "CEPC certification, EPR consultant certification, EPR professional training, plastic waste consultant, environmental compliance career, EPR consultant India",
  alternates: { canonical: "/become-a-cepc" },
  openGraph: {
    title: "Become a Certified EPR Professional Consultant (CEPC) | EPR Compass",
    description:
      "Get CEPC certified. 60-hour training covering all waste categories. Earn ₹50K–₹2L+ per month as an EPR consultant.",
    url: "/become-a-cepc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Certified EPR Professional Consultant (CEPC)",
    description:
      "Get CEPC certified. Build your EPR consulting practice and earn ₹50K–₹2L+ per month.",
  },
};

export default function BecomeACEPCPage() {
  return <BecomeACEPCClient />;
}

