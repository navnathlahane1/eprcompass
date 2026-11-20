import ProgramsHub from "@/components/join-network/ProgramsHub";
import { serviceProviderProgramsConfig } from "@/data/joinNetworkData";

export const metadata = {
  title: "Service Provider Programs | EPR Compass",
  description: "Apply to growth and delivery programs for service providers, consultants, recyclers, and PRO partners.",
  alternates: { canonical: "/join-network/service-provider-programs" },
};

export default function ServiceProviderProgramsPage() {
  return <ProgramsHub config={serviceProviderProgramsConfig} />;
}

