import StudentProgramLanding from "@/components/landing/StudentProgramLanding";

export const metadata = {
  title: "Student Program — Become an Environmental Consultant | EPR Compass",
  description:
    "Training 100 students and fresh graduates to become certified Environmental Consultants. 8-week online program. Apply, get screened, and enrol for ₹4,999.",
  alternates: { canonical: "/students" },
  openGraph: {
    title: "Student Program — Become an Environmental Consultant",
    description: "Launch a green career while you study. 100 seats per cohort. One-time fee ₹4,999.",
    url: "/students",
    type: "website",
  },
};

export default function StudentsPage() {
  return <StudentProgramLanding />;
}

