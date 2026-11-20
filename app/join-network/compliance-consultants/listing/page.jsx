import MarketplaceDirectoryClient from "@/components/join-network/MarketplaceDirectoryClient";
import { createServerComponentClient } from "@/lib/supabase/createServerComponentClient";
import { MARKETPLACE_DIRECTORY_CONFIG } from "@/lib/marketplaceDirectory";

export const metadata = {
  title: "EPR Consultants Network — Browse Listings | EPR Compass",
  description: "Find EPR consultants for CPCB/SPCB filing support, audits, annual returns, and compliance reporting.",
  alternates: { canonical: "/join-network/compliance-consultants/listing" },
};

export default async function ComplianceConsultantsListingPage() {
  const config = MARKETPLACE_DIRECTORY_CONFIG["compliance-consultants"];
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

