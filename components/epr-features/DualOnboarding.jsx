"use client";

import Link from "next/link";
import { ArrowRight, Shield, Users, Recycle, Zap, Award, FileCheck } from "lucide-react";
import { WASTE_CATEGORIES } from "./constants";

const CATEGORY_ICONS = {
  plastic: Recycle,
  ewaste: Zap,
  battery: Shield,
  tyre: Award,
  usedoil: FileCheck,
  elv: Users,
};

export default function DualOnboarding() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-900/95">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            Get Started
          </span>
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            Choose Your Path
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Whether you need EPR compliance or want to become a certified partner — we&apos;ve got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card A: Need Compliance */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 hover:border-eco-green-4/40 transition-colors group">
            <div className="w-12 h-12 bg-eco-green-4/10 rounded-xl flex items-center justify-center mb-5">
              <Shield className="w-6 h-6 text-eco-green-4" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              I Need EPR Compliance
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Get matched with certified consultants who handle registration, filing, and audit for your waste category.
            </p>
            <ul className="space-y-2 mb-6">
              {["Quick profile-based matching", "Multiple consultant proposals", "End-to-end compliance support"].map((item) => (
                <li key={item} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-eco-green-4 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/get-matched"
              className="w-full flex items-center justify-center gap-1.5 bg-eco-green-4 hover:bg-eco-green-5 text-white font-semibold py-3 rounded-lg transition text-sm group-hover:shadow-lg"
            >
              Post Your Requirement <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card B: Become CEPC Partner */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 hover:border-eco-green-4/40 transition-colors group">
            <div className="w-12 h-12 bg-eco-green-4/10 rounded-xl flex items-center justify-center mb-5">
              <Award className="w-6 h-6 text-eco-green-4" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Become a CEPC Partner
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Join our certified consultant network. Get trained, listed, and connected with compliance-seeking businesses.
            </p>
            <ul className="space-y-2 mb-6">
              {["Official CEPC certification", "Lead generation from our platform", "Ongoing training & support"].map((item) => (
                <li key={item} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-eco-green-4 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/become-a-cepc"
              className="w-full flex items-center justify-center gap-1.5 border-2 border-eco-green-4 text-eco-green-4 hover:bg-eco-green-4 hover:text-white font-semibold py-3 rounded-lg transition text-sm group-hover:shadow-lg"
            >
              Start CEPC Journey <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Category Icons */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">We cover all EPR waste categories</p>
          <div className="flex flex-wrap justify-center gap-4">
            {WASTE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key] || Recycle;
              return (
                <div key={cat.key} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Icon size={14} className="text-eco-green-4" />
                  {cat.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
