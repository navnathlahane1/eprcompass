import CEPCDirectory from "@/components/epr-features/CEPCDirectory";

export const metadata = {
  title: "CEPC Directory — Find Certified EPR Consultants | EPR Compass",
  description:
    "Browse our network of CPCB-verified EPR consultants. Filter by state, waste category, and availability to find the right compliance expert.",
  keywords:
    "CEPC directory, EPR consultant, certified EPR professional, EPR compliance India, CPCB verified consultant",
  alternates: { canonical: "/cepc-directory" },
  openGraph: {
    title: "CEPC Directory — Find Certified EPR Consultants | EPR Compass",
    description:
      "Browse our network of CPCB-verified EPR consultants. Filter by state, waste category, and availability.",
    url: "/cepc-directory",
    type: "website",
  },
};

export default function CEPCDirectoryPage() {
  return <CEPCDirectory />;
}

