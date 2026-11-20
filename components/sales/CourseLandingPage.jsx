import Link from "next/link";
import CountdownTimer from "@/components/CountdownTimer";

const benefits = [
  "Understand end-to-end EPR compliance workflows with practical checklists.",
  "Learn how to reduce compliance delays and documentation errors.",
  "Get templates for internal SOPs, reporting, and implementation tracking.",
  "Access implementation-focused guidance from domain practitioners.",
];

const testimonials = [
  {
    quote: "This program gave our team a clear path to execute compliance operations with confidence.",
    name: "Compliance Lead, FMCG Brand",
  },
  {
    quote: "The training was practical and immediately usable for our reporting and audit workflows.",
    name: "EPR Manager, Import Business",
  },
  {
    quote: "Excellent clarity on process execution. We reduced internal back-and-forth significantly.",
    name: "Operations Head, D2C Company",
  },
];

const pricingPoints = [
  "Self-paced access + resource toolkit",
  "Recorded sessions and implementation templates",
  "Dedicated Q&A support window",
  "Certificate of completion",
];

export default function CourseLandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <section aria-labelledby="sales-hero-title" className="relative overflow-hidden bg-eco-gradient-tr text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <p className="font-semibold uppercase tracking-wide text-sm text-eco-ocean-light">Flagship Program</p>
          <h1 id="sales-hero-title" className="font-tricks text-4xl md:text-6xl leading-tight mt-3 mb-5">
            EPR Implementation Masterclass for Teams
          </h1>
          <p className="text-base md:text-xl max-w-2xl text-white/90 mb-8">
            A practical, execution-first training program designed to help businesses move from policy confusion to audit-ready EPR operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/checkout" className="inline-flex items-center justify-center rounded-full bg-white text-eco-green-4 font-semibold px-7 py-3 hover:bg-gray-100 transition">
              Enroll Now — ₹9,999
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/80 text-white font-semibold px-7 py-3 hover:bg-white/10 transition">
              Speak to Advisor
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="course-benefits-title" className="max-w-6xl mx-auto px-4 py-14 md:py-16">
        <h2 id="course-benefits-title" className="text-2xl md:text-4xl font-semibold text-eco-navy dark:text-white mb-6">
          Course Benefits
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-200">
          {benefits.map((item) => (
            <li key={item} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="testimonials-title" className="bg-gray-50 dark:bg-gray-800/50 py-14 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 id="testimonials-title" className="text-2xl md:text-4xl font-semibold text-eco-navy dark:text-white mb-6">
            Testimonials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((item) => (
              <blockquote key={item.quote} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
                <p className="text-gray-700 dark:text-gray-200 mb-4">\"{item.quote}\"</p>
                <cite className="text-sm text-eco-green-4 not-italic font-semibold">{item.name}</cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="instructor-title" className="max-w-6xl mx-auto px-4 py-14 md:py-16">
        <h2 id="instructor-title" className="text-2xl md:text-4xl font-semibold text-eco-navy dark:text-white mb-5">
          Instructor Credibility
        </h2>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 bg-white dark:bg-gray-900">
          <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
            This course is led by practitioners with direct experience in EPR compliance operations, audit preparation, and implementation advisory for regulated businesses. Content is designed for practical application, not theory-only learning.
          </p>
        </div>
      </section>

      <section aria-labelledby="pricing-title" className="bg-eco-navy text-white py-14 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 id="pricing-title" className="text-2xl md:text-4xl font-semibold mb-4">Pricing & CTA</h2>
          <CountdownTimer targetDate="2026-05-31T23:59:59+05:30" label="Early bird pricing ends in" variant="banner" className="mb-8 max-w-xl" />
          <p className="text-white/80 mb-6 max-w-2xl">
            Choose the plan that fits your team and start implementing with confidence.
          </p>
          <div className="max-w-xl rounded-2xl border border-white/20 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-wide text-eco-ocean-light font-semibold">Program Fee</p>
            <p className="text-4xl font-tricks my-3">INR 24,999</p>
            <ul className="space-y-2 text-white/90 mb-6">
              {pricingPoints.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/checkout" className="inline-flex items-center justify-center rounded-full bg-eco-green-4 px-6 py-3 font-semibold hover:bg-eco-green-3 transition">
                Buy Access — ₹24,999
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/80 px-6 py-3 font-semibold hover:bg-white/10 transition">
                Request Team Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
