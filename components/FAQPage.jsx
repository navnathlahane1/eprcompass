"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

const FAQ_DATA = [
  {
    category: "EPR Registration",
    items: [
      { q: "What is Extended Producer Responsibility (EPR)?", a: "EPR is a policy approach where producers are responsible for the treatment or disposal of post-consumer products. In India, it is governed by CPCB under the Plastic Waste Management Rules 2016 (amended 2022), E-Waste Management Rules, Battery Waste Management Rules, and other category-specific regulations." },
      { q: "Who needs EPR registration?", a: "All producers, importers, and brand owners (PIBOs) who manufacture or import products that generate plastic waste, e-waste, battery waste, tyre waste, used oil, or end-of-life vehicles must obtain EPR registration from CPCB." },
      { q: "How long does EPR registration take?", a: "Typically 30–90 days depending on your waste category, documentation readiness, and CPCB processing timelines. With our expert assistance, many registrations are completed within 45 days." },
      { q: "What documents are required for EPR registration?", a: "Key documents include: Company incorporation certificate, GST registration, PAN card, board resolution, product details with waste category classification, estimated production/import quantity, and authorized signatory details." },
      { q: "Can I register for multiple waste categories under one EPR?", a: "No, separate EPR registrations are required for each waste category (e.g., plastic waste, e-waste, battery waste). Each has its own CPCB portal and compliance requirements." },
    ],
  },
  {
    category: "EPR Certificates",
    items: [
      { q: "What is an EPR certificate?", a: "An EPR certificate is proof that a specified quantity of waste has been collected, recycled, or disposed of through authorized channels. It is issued by registered recyclers/dismantlers and is used to fulfill your annual EPR targets." },
      { q: "How do I procure EPR certificates?", a: "You can procure certificates from authorized recyclers directly, through PROs (Producer Responsibility Organizations), or through our platform which connects you with verified recyclers across India." },
      { q: "What is the cost of EPR certificates?", a: "Costs vary by waste category, market demand, and quantity. Plastic waste certificates range from ₹5–₹25 per kg, e-waste from ₹15–₹40 per kg, and battery waste from ₹10–₹30 per kg. Use our EPR Calculator for a personalized estimate." },
      { q: "Are EPR certificates tradable?", a: "Yes, EPR certificates can be bought and sold between registered entities through authorized channels. Our Recycler Connect marketplace facilitates this trading." },
    ],
  },
  {
    category: "Compliance & Filing",
    items: [
      { q: "What are EPR annual returns?", a: "EPR annual returns are mandatory filings submitted to CPCB through the centralized portal. They report your production/import quantities, EPR targets, certificates procured, and recycling achieved during the financial year." },
      { q: "When is the EPR annual return filing deadline?", a: "Annual returns must be filed by June 30 of each year for the preceding financial year (April 1 – March 31). Late filing can attract penalties." },
      { q: "What happens if I don't comply with EPR obligations?", a: "Non-compliance can result in: Show cause notices from CPCB/SPCB, environmental compensation penalties (₹5 Lakhs to ₹50 Lakhs+), cancellation of EPR registration, and potential business operation restrictions." },
      { q: "How are EPR targets calculated?", a: "Targets are based on your product introduction quantity (manufacture + import) multiplied by the collection/recycling percentage set by CPCB for that financial year and waste category. Targets increase progressively each year." },
    ],
  },
  {
    category: "CEPC Certification",
    items: [
      { q: "What is CEPC certification?", a: "CEPC (Certified EPR Professional Consultant) is our certification program that trains and certifies individuals to become EPR consultants. It covers all 6 waste categories and includes practical case studies." },
      { q: "How long is the CEPC training?", a: "The program is 60 hours of comprehensive training delivered over 4–6 weeks, combining live sessions, recorded modules, practical assignments, and a final certification exam." },
      { q: "What can I earn as a CEPC?", a: "Certified CEPCs typically earn ₹50,000 to ₹2,00,000+ per month depending on their client base, specialization, and geography. Our platform provides lead generation support." },
      { q: "Is there a prerequisite for CEPC certification?", a: "No formal prerequisites, but backgrounds in environmental science, law, business, or engineering are advantageous. A strong interest in environmental compliance and entrepreneurship is essential." },
    ],
  },
  {
    category: "Pricing & Payments",
    items: [
      { q: "What are your service charges?", a: "We offer three tiers: Starter (₹29,999/year for single-category EPR registration + basic compliance), Professional (₹59,999/year for multi-category + certificates + quarterly filing), and Enterprise (custom pricing for end-to-end compliance management)." },
      { q: "Do you offer refunds?", a: "Yes, we have a 7-day refund policy for training programs and a pro-rated refund for service subscriptions if cancelled within 30 days. See our Refund & Cancellation Policy for details." },
      { q: "What payment methods do you accept?", a: "We accept UPI, debit/credit cards, net banking, and wire transfers through our secure Razorpay payment gateway. EMI options are available for amounts above ₹10,000." },
    ],
  },
  {
    category: "Platform & Tools",
    items: [
      { q: "How does the Recycler Connect marketplace work?", a: "Recycler Connect lets verified recyclers list their certificate buying/selling capacity. Producers can browse, filter by category and location, and initiate connections — all facilitated through our platform." },
      { q: "Is the EPR Calculator accurate?", a: "Our calculator provides indicative estimates based on CPCB's published guidelines and current market rates. Actual obligations may vary. We recommend consulting with our experts for precise calculations." },
      { q: "Can I track my compliance status online?", a: "Yes, our Portal dashboard provides real-time compliance tracking including: registration status, certificate procurement progress, filing deadlines, and audit readiness scores." },
    ],
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState("");

  const filteredData = useMemo(() => {
    const q = search.toLowerCase().trim();
    return FAQ_DATA.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (activeCategory && section.category !== activeCategory) return false;
        if (!q) return !activeCategory || section.category === activeCategory;
        return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      }),
    })).filter((section) => section.items.length > 0);
  }, [search, activeCategory]);

  const totalResults = filteredData.reduce((sum, s) => sum + s.items.length, 0);

  const toggle = (key) => setOpenIndex(openIndex === key ? null : key);

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            Help Center
          </span>
          <h1 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Everything you need to know about EPR compliance, registration, certificates, and our services.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
          />
          {search && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {totalResults} result{totalResults !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setActiveCategory("")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              !activeCategory
                ? "bg-eco-green-4 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>
          {FAQ_DATA.map((section) => (
            <button
              key={section.category}
              onClick={() => setActiveCategory(activeCategory === section.category ? "" : section.category)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                activeCategory === section.category
                  ? "bg-eco-green-4 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {section.category}
            </button>
          ))}
        </div>

        {/* Accordion */}
        {filteredData.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-40" />
            <p>No questions match your search. Try different keywords.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredData.map((section) => (
              <div key={section.category}>
                <h2 className="text-sm font-bold text-eco-green-4 uppercase tracking-widest mb-3">{section.category}</h2>
                <div className="space-y-2">
                  {section.items.map((item, i) => {
                    const key = `${section.category}-${i}`;
                    const isOpen = openIndex === key;
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden"
                      >
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center justify-between text-left px-5 py-4 gap-3"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.q}</span>
                          {isOpen ? (
                            <ChevronUp size={16} className="text-eco-green-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Still have questions?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Our EPR experts are here to help.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/contact" className="bg-eco-green-4 hover:bg-eco-green-5 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
              Contact Us
            </a>
            <a href="/get-matched" className="border-2 border-eco-green-4 text-eco-green-4 hover:bg-eco-green-4 hover:text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
              Get Expert Help
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
