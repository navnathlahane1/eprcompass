import FAQPage from "@/components/FAQPage";

export const metadata = {
  title: "FAQs — EPR Compliance, Registration & Certificates | EPR Compass",
  description:
    "Find answers to common questions about EPR registration, certificates, compliance filing, CEPC certification, and our services.",
  keywords:
    "EPR FAQ, EPR registration questions, EPR certificate help, EPR compliance questions, CPCB registration FAQ, EPR India",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQs — EPR Compliance, Registration & Certificates | EPR Compass",
    description: "Find answers to common questions about EPR registration, certificates, compliance filing, and our services.",
    url: "/faq",
    type: "website",
  },
};

export default function FAQRoute() {
  return <FAQPage />;
}

