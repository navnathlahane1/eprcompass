"use client";
import Link from "next/link";
import {
  FileText, ChevronRight, CheckCircle, BookOpen, CreditCard, Briefcase, ShieldAlert,
  ShieldCheck, UserCheck, Database, Megaphone, Share2, Lock,
  RotateCcw, Clock, XCircle, Ban, Mail,
  Truck, Monitor, HelpCircle,
  AlertTriangle, ListChecks, Scale, Package, Laptop, LifeBuoy, AlertCircle, MessageSquare,
} from "lucide-react";
import useScrollReveal from "@/components/useScrollReveal";
import { useRef } from "react";

const iconMap = {
  FileText, ChevronRight, CheckCircle, BookOpen, CreditCard, Briefcase, ShieldAlert,
  ShieldCheck, UserCheck, Database, Megaphone, Share2, Lock,
  RotateCcw, Clock, XCircle, Ban, Mail,
  Truck, Monitor, HelpCircle,
  AlertTriangle, ListChecks, Scale, Package, Laptop, LifeBuoy, AlertCircle, MessageSquare,
};

function resolveIcon(icon, fallback = ChevronRight) {
  if (!icon) return fallback;
  if (typeof icon === "string") return iconMap[icon] || fallback;
  return fallback;
}

export default function LegalPageLayout({ title, lastUpdated, intro, sections = [], icon = "FileText" }) {
  const PageIcon = resolveIcon(icon, FileText);
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  useScrollReveal(heroRef);
  useScrollReveal(contentRef, { delay: 0.1 });

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Hero Section */}
      <div ref={heroRef}>
        <section className="relative overflow-hidden bg-gradient-to-br from-eco-navy via-eco-navy-light to-eco-navy py-16 md:py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-eco-green-4 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-56 h-56 bg-eco-ocean rounded-full blur-3xl" />
          </div>
          <div className="max-w-5xl mx-auto px-4 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <PageIcon size={20} className="text-eco-green-4" />
              <p className="text-sm font-semibold text-eco-green-4 tracking-wide uppercase">Compliance Document</p>
            </div>
            <h1 className="font-tricks text-3xl md:text-5xl text-white mb-4">{title}</h1>
            {lastUpdated && (
              <p className="text-sm text-white/60 mb-4">Last updated: {lastUpdated}</p>
            )}
            {intro && (
              <p className="text-base md:text-lg text-white/80 max-w-3xl leading-relaxed">{intro}</p>
            )}
          </div>
        </section>
      </div>

      {/* Content Sections */}
      <div ref={contentRef}>
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="space-y-8">
            {sections.map((section, sectionIdx) => {
              const SectionIcon = resolveIcon(section.icon);
              return (
                <section
                  key={section.heading}
                  aria-labelledby={section.id || section.heading}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 md:p-8 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-eco-green-4/10 flex items-center justify-center">
                      <SectionIcon size={20} className="text-eco-green-4" />
                    </div>
                    <h2
                      id={section.id || section.heading}
                      className="font-tricks text-xl md:text-2xl text-eco-navy dark:text-white pt-1"
                    >
                      {section.heading}
                    </h2>
                  </div>
                  {section.paragraphs?.map((paragraph, index) => (
                    <p key={`${section.heading}-p-${index}`} className="text-gray-700 dark:text-gray-200 leading-relaxed mb-3 pl-[52px]">
                      {paragraph}
                    </p>
                  ))}
                  {section.points?.length ? (
                    <ul className="pl-[52px] space-y-2 text-gray-700 dark:text-gray-200">
                      {section.points.map((point, index) => (
                        <li key={`${section.heading}-li-${index}`} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-eco-green-4 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
          </div>

          {/* Contact CTA Card */}
          <div className="mt-12 rounded-2xl bg-gradient-to-r from-eco-green-4/10 to-eco-ocean/10 border border-eco-green-4/20 p-6 md:p-8 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-tricks text-lg md:text-xl text-eco-navy dark:text-white mb-1">Need Clarification?</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200">Our team is here to help you understand our policies and compliance requirements.</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-eco-green-4 hover:bg-eco-green-5 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm whitespace-nowrap"
            >
              Contact Us <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
