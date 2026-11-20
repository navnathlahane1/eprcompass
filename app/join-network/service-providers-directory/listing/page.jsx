import MarketplaceDirectoryClient from "@/components/join-network/MarketplaceDirectoryClient";
import { createServerComponentClient } from "@/lib/supabase/createServerComponentClient";
import { MARKETPLACE_DIRECTORY_CONFIG } from "@/lib/marketplaceDirectory";

export const metadata = {
  title: "Environmental Services Directory — Browse Listings | EPR Compass",
  description: "Browse verified environmental service providers for EIA, water management, air quality, soil remediation, green certification, and sustainability services.",
  alternates: { canonical: "/join-network/service-providers-directory/listing" },
};

export default async function ServiceProvidersDirectoryListingPage() {
  const config = MARKETPLACE_DIRECTORY_CONFIG["service-providers-directory"];
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

