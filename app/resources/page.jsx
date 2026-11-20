import ResourceHub from "@/components/ResourceHub";

export const metadata = {
  title: "EPR Resource Hub — Guides, Tools & Templates | EPR Compass",
  description:
    "Free EPR compliance resources: starter guides, obligation calculators, filing templates, regulatory summaries, and interactive tools.",
  keywords:
    "EPR resources, EPR guides, EPR templates, EPR compliance tools, EPR regulation summary, CPCB guidelines India",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "EPR Resource Hub — Guides, Tools & Templates | EPR Compass",
    description: "Free EPR compliance resources: guides, calculators, templates, and regulatory summaries.",
    url: "/resources",
    type: "website",
  },
};

export default function ResourcesPage() {
  return <ResourceHub />;
}

