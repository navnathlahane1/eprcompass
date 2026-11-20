import RecyclerConnect from "@/components/epr-features/RecyclerConnect";

export const metadata = {
  title: "Recycler Connect — EPR Compass Marketplace | EPR Compass",
  description:
    "Connect with verified recyclers to buy or sell EPR certificates. Filter by waste category and location across India.",
  keywords:
    "EPR certificate marketplace, buy EPR certificates, sell EPR certificates, recycler directory, waste recycler India",
  alternates: { canonical: "/recycler-connect" },
  openGraph: {
    title: "Recycler Connect — EPR Compass Marketplace | EPR Compass",
    description:
      "Connect with verified recyclers to buy or sell EPR certificates. Filter by waste category and location.",
    url: "/recycler-connect",
    type: "website",
  },
};

export default function RecyclerConnectPage() {
  return <RecyclerConnect />;
}

