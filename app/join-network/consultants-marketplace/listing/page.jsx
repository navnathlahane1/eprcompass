import MarketplaceDirectoryClient from "@/components/join-network/MarketplaceDirectoryClient";
import { createServerComponentClient } from "@/lib/supabase/createServerComponentClient";
import { MARKETPLACE_DIRECTORY_CONFIG } from "@/lib/marketplaceDirectory";

export const metadata = {
  title: "Consultants Marketplace — Browse Listings | EPR Compass",
  description: "Search and connect with waste management consultants for compliance planning, audits, and EPR execution.",
  alternates: { canonical: "/join-network/consultants-marketplace/listing" },
};

export default async function ConsultantsMarketplaceListingPage() {
  const config = MARKETPLACE_DIRECTORY_CONFIG["consultants-marketplace"];
  const supabase = await createServerComponentClient();

  const { data: profiles } = await supabase
    .from("marketplace_profiles")
    .select("id, full_name, company_name, email, phone, state, city, bio, years_experience, focus_areas, waste_categories, services_offered, website")
    .eq("listing_type", config.listingType)
    .eq("approval_status", "Approved")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return <MarketplaceDirectoryClient config={config} initialProfiles={profiles || []} />;
}

