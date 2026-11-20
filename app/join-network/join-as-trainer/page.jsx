import Link from "next/link";
import { GraduationCap, Monitor, Users, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Join as a Trainer | EPR Compass",
  description: "Apply to join EPR Compass as a trainer and deliver compliance-focused sessions for industry learners.",
  alternates: { canonical: "/join-network/join-as-trainer" },
};

const trainerTracks = [
  "PWM Rules and EPR fundamentals",
  "CPCB portal filing and annual return workflows",
  "EPR target planning and credits strategy",
  "Operational implementation with PRO and recycler networks",
  "Setting up end-to-end waste management plans for brands and producers",
  "Sales and business development playbooks for recycling plants",
  "B2B partnership building for collection, aggregation, and recycling ecosystems",
];

export default function JoinAsTrainerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-14 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 bg-eco-green-4/10 text-eco-green-4 text-xs font-semibold px-3 py-1 rounded-full">
            <GraduationCap size={14} /> Join Network
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Join as a Trainer</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-3xl">
            Collaborate with our academy and training initiatives to deliver practical, compliance-first learning for
            producers, importers, brand owners, recyclers, and compliance teams.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-eco-green-4 hover:bg-eco-green-5 text-white px-4 py-2 text-sm font-semibold transition">
              Apply Now <ArrowRight size={16} />
            </Link>
            <Link href="/trainings" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
              View Training Programs
            </Link>
            <Link href="/work-with-us" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
              Work With Us
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Priority Trainer Tracks</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {trainerTracks.map((track) => (
              <div key={track} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
                <Monitor size={18} className="text-eco-green-4 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-200">{track}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Who Should Apply</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Experienced consultants, compliance managers, ex-regulatory professionals, and domain experts with strong
            execution knowledge and willingness to teach practical workflows.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <Users size={16} className="text-eco-green-4" />
            Training opportunities available for webinars, cohorts, and specialized workshops.
          </div>
        </section>
      </div>
    </div>
  );
}

