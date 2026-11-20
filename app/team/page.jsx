import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export default function TeamPage() {
  return (
    <main className="min-h-[60vh] bg-white px-6 py-24 text-center dark:bg-gray-900">
      <div className="mx-auto max-w-2xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Users aria-hidden="true" size={30} />
        </span>
        <h1 className="mt-6 text-4xl font-bold text-slate-900 dark:text-white">Our team</h1>
        <p className="mt-4 text-lg leading-7 text-slate-600 dark:text-slate-300">Team profiles and details will be added here once confirmed.</p>
        <Link href="/about-us" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">About us <ArrowRight size={16} /></Link>
      </div>
    </main>
  );
}
