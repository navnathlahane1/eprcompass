import EPRPenaltyChecker from "@/components/epr-features/EPRPenaltyChecker";

export const metadata = {
  title: "EPR Penalty Checker | EPR Compass",
  description:
    "Check if your company has a CPCB / SPCB EPR notice or Environmental Compensation demand on record. Search by company name and get expert help to respond.",
  keywords:
    "EPR penalty checker, CPCB notice, environmental compensation, EPR non-compliance, show cause notice, EPR penalty India",
  alternates: { canonical: "/epr-penalty-checker" },
  openGraph: {
    title: "EPR Penalty Checker | EPR Compass",
    description:
      "Search your company to see if an EPR notice or Environmental Compensation demand is on record — and get expert help to respond.",
    url: "/epr-penalty-checker",
    type: "website",
  },
};

export default function EPRPenaltyCheckerPage() {
  return <EPRPenaltyChecker />;
}

