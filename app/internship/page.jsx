import InternshipLanding from "@/components/landing/InternshipLanding";

export const metadata = {
  title: "Join Our Environmental Compliance Internship Program | EPR Compass",
  description:
    "A 100% free, remote internship in EPR, e-waste, plastic & battery waste management, and sustainability consulting. Limited to 25 interns. Apply now.",
  alternates: { canonical: "/internship" },
  openGraph: {
    title: "Environmental Compliance Internship Program",
    description: "Free remote internship with live projects, mentorship and a completion certificate. Only 25 seats.",
    url: "/internship",
    type: "website",
  },
};

export default function InternshipPage() {
  return <InternshipLanding />;
}

