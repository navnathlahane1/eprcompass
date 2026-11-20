import { serviceContent } from "@/data/serviceContent";
import ServicePage from "@/components/services/ServicePage";

export const metadata = {
  ...serviceContent["elv-epr"].hero,
  title: "ELV EPR (End-of-Life Vehicle) | EPR Compass",
  description: "Independent ELV EPR advisory and compliance operations for entities with ELV-linked obligations and circularity commitments.",
  alternates: { canonical: "/services/elv-epr" },
  openGraph: {
    title: "ELV EPR (End-of-Life Vehicle) | EPR Compass",
    description: "Independent ELV EPR advisory and compliance operations for entities with ELV-linked obligations and circularity commitments.",
    url: "/services/elv-epr",
    type: "website",
  },
};

export default function ELVEPRPage() {
  return <ServicePage serviceKey="elv-epr" />;
}

