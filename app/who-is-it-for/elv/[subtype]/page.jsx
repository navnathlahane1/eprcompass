import { notFound } from "next/navigation";
import WhoIsItForCategoryPage from "@/components/who-is-it-for/WhoIsItForCategoryPage";
import { whoIsItForContent } from "@/data/whoIsItForContent";

export default function WhoIsItForELVSubtypePage({ params }) {
  const { subtype } = params;
  // For now, just show the main ELV page for any subtype, or 404 if not ELV
  if (!whoIsItForContent.elv) return notFound();
  return <WhoIsItForCategoryPage categoryKey="elv" />;
}
