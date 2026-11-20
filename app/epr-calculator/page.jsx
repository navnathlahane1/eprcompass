import EPRCalculator from "@/components/epr-features/EPRCalculator";

export const metadata = {
  title: "EPR Calculator India — Estimate Targets and Certificate Cost",
  description:
    "Free EPR calculator for Indian PIBOs. Estimate plastic, e-waste and battery EPR target quantity and certificate cost before CPCB filing.",
  keywords:
    "EPR calculator, EPR target calculator India, EPR certificate cost, plastic EPR calculator, CPCB EPR obligation",
  alternates: { canonical: "/epr-calculator" },
  openGraph: {
    title: "EPR Obligation Calculator | EPR Compass",
    description:
      "Estimate your EPR target quantity and compliance costs instantly based on your waste category and production data.",
    url: "/epr-calculator",
    type: "website",
  },
};

export default function EPRCalculatorPage() {
  return <EPRCalculator />;
}

