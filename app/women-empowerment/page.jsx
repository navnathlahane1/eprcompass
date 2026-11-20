import WomenEmpowermentLanding from "@/components/landing/WomenEmpowermentLanding";

export const metadata = {
  title: "Women Empowerment Program — Become an Environmental Consultant | EPR Compass",
  description:
    "A women empowerment initiative training 100 educated women and homemakers to become certified Environmental Consultants. 8-week online program. Enroll for ₹4,999.",
  alternates: { canonical: "/women-empowerment" },
  openGraph: {
    title: "Women Empowerment Program — Become an Environmental Consultant",
    description:
      "Train to become a certified Environmental Consultant. 100 seats per cohort. One-time fee ₹4,999.",
    url: "/women-empowerment",
    type: "website",
  },
};

export default function WomenEmpowermentPage() {
  return <WomenEmpowermentLanding />;
}

