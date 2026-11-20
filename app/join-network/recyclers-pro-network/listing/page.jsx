import MarketplaceDirectoryClient from "@/components/join-network/MarketplaceDirectoryClient";
import { createServerComponentClient } from "@/lib/supabase/createServerComponentClient";
import { MARKETPLACE_DIRECTORY_CONFIG } from "@/lib/marketplaceDirectory";

export const metadata = {
  title: "Recyclers & PRO Network — Browse Listings | EPR Compass",
  description: "Connect with recyclers and PRO partners for target fulfillment, channelization evidence, and certificate support.",
  alternates: { canonical: "/join-network/recyclers-pro-network/listing" },
};

export default async function RecyclersProNetworkListingPage() {
  const config = MARKETPLACE_DIRECTORY_CONFIG["recyclers-pro-network"];
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

