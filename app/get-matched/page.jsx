import GetMatchedForm from "@/components/epr-features/GetMatchedForm";

export const metadata = {
  title: "Get Matched with an EPR Expert | EPR Compass",
  description:
    "Post your EPR compliance requirement and get matched with the best-fit certified consultant within 24 hours.",
  keywords:
    "EPR compliance help, find EPR consultant, EPR registration, EPR filing, EPR audit, waste management consultant India",
  alternates: { canonical: "/get-matched" },
  openGraph: {
    title: "Get Matched with an EPR Expert | EPR Compass",
    description:
      "Post your EPR compliance requirement and get matched with the best-fit certified consultant within 24 hours.",
    url: "/get-matched",
    type: "website",
  },
};

export default function GetMatchedPage() {
  return <GetMatchedForm />;
}

