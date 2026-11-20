import { notFound } from "next/navigation";
import MarketplaceRegistrationClient from "@/components/join-network/MarketplaceRegistrationClient";
import { REGISTRATION_TYPE_CONFIG } from "@/lib/marketplaceDirectory";

export default async function MarketplaceRegistrationPage({ params }) {
  const { type } = await params;
  const config = REGISTRATION_TYPE_CONFIG[type];
  if (!config) notFound();

  return <MarketplaceRegistrationClient config={config} />;
}
