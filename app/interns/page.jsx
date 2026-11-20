import InternManagementClient from "@/components/interns/InternManagementClient";

export const metadata = {
  title: "Intern Management | EPR Compass",
  description: "Manage interns, assign and track tasks, and monitor active interns.",
  alternates: { canonical: "/interns" },
};

export default function InternsPage() {
  return <InternManagementClient />;
}

