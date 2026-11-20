import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "@/components/public-site/PublicVisuals";

export default function ContactFaq({ faqData = [] }) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle title="Frequently Asked Questions" />
      <div className="mx-auto mt-7 grid max-w-7xl gap-x-8 md:grid-cols-2">
        {faqData.map((faq) => (
          <details key={faq.question} className="group border border-b-0 border-[var(--epr-border)] last:border-b md:[&:nth-last-child(-n+2)]:border-b">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 text-[12px] font-semibold text-[#263f46] marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--epr-green)]">
              {faq.question}<ChevronDown size={15} className="shrink-0 transition group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 text-[12px] leading-5 text-[var(--epr-muted)]">{faq.answer}</p>
          </details>
        ))}
      </div>
      <div className="mt-5 text-center"><Link href="/faq" className="epr-button epr-button-secondary">View All FAQs <span aria-hidden="true">→</span></Link></div>
    </section>
  );
}
