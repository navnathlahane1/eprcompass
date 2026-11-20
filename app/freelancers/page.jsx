import FreelancerManagementClient from "@/components/freelancers/FreelancerManagementClient";

export const metadata = {
  title: "Freelancer Management | EPR Compass",
  description: "Manage freelancers, assign and track projects, and monitor active engagements.",
  alternates: { canonical: "/freelancers" },
};

export default function FreelancersPage() {
  return <FreelancerManagementClient />;
}

