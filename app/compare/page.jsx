import ComparisonMatrix from "@/components/ComparisonMatrix";

export const metadata = {
  title: "Compare EPR Service Plans — Starter, Professional & Enterprise | EPR Compass",
  description:
    "Compare our EPR compliance service plans side-by-side. From single-category registration to end-to-end enterprise compliance management.",
  keywords:
    "EPR pricing, EPR service plans, EPR compliance cost, EPR registration price, compare EPR services India",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare EPR Service Plans | EPR Compass",
    description: "Compare our EPR compliance service plans side-by-side. Find the right fit for your business.",
    url: "/compare",
    type: "website",
  },
};

export default function ComparePage() {
  return <ComparisonMatrix />;
}

