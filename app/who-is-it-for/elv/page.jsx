import { whoIsItForContent } from "@/data/whoIsItForContent";
import WhoIsItForCategoryPage from "@/components/who-is-it-for/WhoIsItForCategoryPage";


export const metadata = {
  title: whoIsItForContent.elv?.hero?.title || "Who Is It For: ELV (End-of-Life Vehicle) | EPR Compass",
  description: whoIsItForContent.elv?.hero?.description || "ELV EPR compliance, registration, and advisory for vehicle manufacturers, dismantlers, and recyclers.",
  alternates: { canonical: "/who-is-it-for/elv" },
  openGraph: {
    title: whoIsItForContent.elv?.hero?.title || "Who Is It For: ELV (End-of-Life Vehicle) | EPR Compass",
    description: whoIsItForContent.elv?.hero?.description || "ELV EPR compliance, registration, and advisory for vehicle manufacturers, dismantlers, and recyclers.",
    url: "/who-is-it-for/elv",
    type: "website",
  },
};

export default function WhoIsItForELVPage() {
  return <WhoIsItForCategoryPage categoryKey="elv" />;
}

