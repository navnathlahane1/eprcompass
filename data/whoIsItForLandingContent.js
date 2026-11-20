/**
 * High-converting landing page content: Problem, 5C Solution, Pricing, Trust Badges.
 * Keys must match whoIsItForContent.js. Page renders these when present.
 */

export const TRUST_BADGES = [
  "2,000+ Companies Registered",
  "CPCB EPR Portal Certified",
  "PWM Rules 2022 Compliant",
  "200+ Verified Recyclers & PROs",
  "100% First-Year Compliance Rate",
];


export const whoIsItForLandingContent = {
  eprProducers: {
    heroSubtext: "70% of producers miss their first EPR filing deadline. Don't be one of them.",
    problem: {
      heading: "Producers Face Complex EPR Obligations",
      items: [
        "Confusing CPCB portal with constantly changing requirements",
        "Unclear EPR targets and category classifications",
        "Risk of penalties up to ₹25 lakh for non-compliance",
        "Difficulty finding verified recyclers and PROs",
        "Time-consuming annual return filing and documentation",
      ],
      tagline: "You need a compliance partner, not just a consultant.",
      cta: "Get Expert Guidance",
    },
    solution5C: [
      { title: "Classify", desc: "Accurate EPR category identification and target calculation for your product portfolio." },
      { title: "Comply", desc: "End-to-end CPCB portal registration, documentation and filing support." },
      { title: "Certify", desc: "EPR certificate procurement from verified recyclers at competitive rates." },
      { title: "Control", desc: "Quarterly tracking dashboards, compliance alerts and deadline management." },
      { title: "Continue", desc: "Annual return filing, target revision support and ongoing compliance updates." },
    ],
    pricingTiers: [
      { name: "Starter", items: ["EPR registration assistance", "Category classification", "Basic portal support", "Email support"], cta: "Get Started", highlight: false },
      { name: "Professional", items: ["Everything in Starter", "Certificate procurement", "Annual return filing", "Quarterly compliance tracking", "Dedicated account manager"], cta: "Most Popular", highlight: true },
      { name: "Enterprise", items: ["Everything in Professional", "Multi-product portfolio management", "Recycler network access", "Compliance audit & gap analysis", "Priority support & SLA"], cta: "Contact Sales", highlight: false },
    ],
    finalCta: { heading: "Start Your EPR Compliance Journey Today", subheading: "Join 2,000+ producers who trust us with their EPR obligations.", primaryCta: "Schedule Free Consultation", secondaryCta: "Download EPR Starter Kit", contact: "Contact our team:" },
  },
  eprBrandOwners: {
    heroSubtext: "Brand owners are liable for EPR even if they don't manufacture. Most find out too late.",
    problem: {
      heading: "Brand Owners Often Discover EPR Obligations After Penalties",
      items: [
        "Unaware that importing or branding products triggers EPR liability",
        "No in-house expertise to navigate CPCB registration",
        "Difficulty calculating targets across multiple product categories",
        "Rising EPR certificate costs eating into margins",
        "Supply chain partners pushing compliance responsibility downstream",
      ],
      tagline: "Protect your brand. Get compliant before the next audit.",
      cta: "Check Your EPR Liability",
    },
    solution5C: [
      { title: "Clarify", desc: "Determine your exact EPR liability across all brand categories and import lines." },
      { title: "Comply", desc: "CPCB registration, documentation and portal filing handled end-to-end." },
      { title: "Certify", desc: "Cost-optimised EPR certificate procurement through our 200+ recycler network." },
      { title: "Control", desc: "Real-time compliance dashboard with automated alerts before every deadline." },
      { title: "Conserve", desc: "Sustainable packaging advisory to reduce EPR targets and certificate costs." },
    ],
    pricingTiers: [
      { name: "Essential", items: ["EPR liability assessment", "Single-category registration", "Basic certificate procurement", "Annual return support"], cta: "Get Started", highlight: false },
      { name: "Growth", items: ["Everything in Essential", "Multi-category management", "Quarterly tracking & alerts", "Certificate cost optimisation", "Dedicated compliance manager"], cta: "Most Popular", highlight: true },
      { name: "Enterprise", items: ["Everything in Growth", "Pan-India multi-brand management", "Sustainable packaging advisory", "Compliance audit & board reporting", "Priority support & custom SLA"], cta: "Contact Sales", highlight: false },
    ],
    finalCta: { heading: "Protect Your Brand From EPR Penalties", subheading: "Join 500+ brand owners achieving hassle-free compliance.", primaryCta: "Schedule Free Consultation", secondaryCta: "Download Compliance Checklist", contact: "Contact our team:" },
  },
  eprRecyclers: {
    heroSubtext: "Earn ₹8,000–₹30,000 per tonne in EPR credit value. India's only portal built exclusively for registered recyclers and PROs.",
    heroBullets: [
      "AI tender match scoring 0–100 by your EPR category, state, capacity & certifications",
      "Live auction rooms — real-time rank, countdown & auto-extension alerts",
      "CPCB, MoEFCC & SPCB regulatory alerts filtered to your waste categories",
      "Direct corporate sourcing requests with 5-round negotiation & immutable audit log",
    ],
    heroCtaPrimary: "Access Recycler Portal",
    heroCtaSecondary: "Request a Demo",
    problem: {
      heading: "Recyclers Are Leaving Revenue on the Table Without Intelligence",
      items: [
        "Tender opportunities from corporates are scattered — no centralised matching for your categories and states",
        "Auction bidding is blind — no live rank tracking, no auto-extension alerts, no market context",
        "CPCB and SPCB regulatory changes arrive too late, causing avoidable compliance deadline misses",
        "Corporate procurement requests come informally — no structured negotiation or audit trail",
        "EPR credit pricing is opaque — you sell without knowing the true market rate by category and state",
      ],
      tagline: "You need an intelligence portal, not just a registration.",
      cta: "Access Recycler Portal",
    },
    solution5C: [
      { title: "Connect", desc: "Onboard with your CPCB registration code. Our team verifies your categories, states and certifications within 24–48 hours — auto-populated from CPCB records." },
      { title: "Compete", desc: "AI Tender Matching surfaces the best-fit tenders with a 0–100 match score. Bid in live REVERSE and FORWARD auctions with real-time rank updates and auto-extension alerts." },
      { title: "Comply", desc: "CPCB, MoEFCC and SPCB regulatory alerts are urgency-ranked and filtered to your exact waste categories. CRITICAL alerts delivered instantly — never miss a deadline again." },
      { title: "Close", desc: "Respond to direct corporate sourcing requests with structured 5-round counter-offer negotiation threads. Every message is time-stamped and immutable — a complete audit log." },
      { title: "Certify", desc: "Issue valid EPR credit certificates with full traceability, quarterly tonnage reporting, CPCB annual return filing support, and cert renewal tracking." },
    ],
    testimonialsExtra: [
      { name: "Operations Head", role: "Plastic Recycling Unit, Maharashtra", quote: "The tender matching feature alone saved us hours of manual screening. We now respond only to tenders where we score above 70 — and our close rate has tripled." },
      { name: "PRO Manager", role: "E-Waste Management Company, Karnataka", quote: "The live auction room is a game-changer. Real-time rank tracking, no page refresh. We closed three EPR credit contracts in the first week on the platform." },
    ],
    pricingTiers: [
      { name: "Recycler Registered", items: ["PRO/PWP registration support", "Recycler Portal access", "Tender alert feed (basic)", "CPCB regulatory alerts", "Document vault", "Email support"], cta: "Get Registered", highlight: false },
      { name: "Recycler Active", items: ["Everything in Registered", "AI tender match scoring (0–100)", "Live auction room access", "Corporate request inbox", "5-round negotiation threads", "Price intelligence feed", "Dedicated account manager"], cta: "Most Popular — Contact Us", highlight: true },
      { name: "Recycler Enterprise", items: ["Everything in Active", "Priority tender & auction alerts", "Custom traceability system", "Pan-India multi-state support", "Revenue optimisation dashboard", "API access for integration", "Dedicated compliance officer"], cta: "Request Partnership", highlight: false }
    ],
    finalCta: { heading: "Win More Contracts with the Recycler Intelligence Portal", subheading: "Tender matching, live auctions, CPCB alerts and corporate negotiations — all in one place. Join 200+ verified recyclers already earning more.", primaryCta: "Access Recycler Portal", secondaryCta: "View Recycler Network", contact: "Contact our team:" }
  },
  eprCompliance: {
    heroSubtext: "EPR regulations change faster than most compliance teams can track. Stay ahead with expert guidance.",
    heroBullets: [
      "Real-time PWM Rules 2022 and CPCB notification alerts",
      "EPR certificate authenticity verification tools",
      "Form 1 & Form 2 report templates and filing support",
      "Team training and capacity building for CPCB portal",
    ],
    heroCtaPrimary: "View EPR Guidelines",
    heroCtaSecondary: "Contact Us",
    problem: {
      heading: "Compliance Teams Struggle to Keep Up with Evolving EPR Rules",
      items: [
        "Frequent updates to PWM Rules and CPCB notifications create confusion",
        "Difficulty verifying EPR certificate authenticity across recyclers",
        "Inconsistent reporting standards across states and auditors",
        "Limited training resources for compliance and enforcement teams",
        "No centralised source for the latest CPCB circulars and MoEFCC orders",
      ],
      tagline: "You need a compliance intelligence partner, not just a guidebook.",
      cta: "Get Expert Guidance",
    },
    solution5C: [
      { title: "Capture", desc: "Subscribe to real-time regulatory alerts for PWM Rules 2022 changes, CPCB notifications, and MoEFCC circulars tailored to your waste categories." },
      { title: "Clarify", desc: "Expert interpretation of CPCB guidelines, Form 1 & Form 2 requirements, and EPR target obligations for your sector." },
      { title: "Certify", desc: "Tools to verify EPR certificate authenticity, check recycler registration status, and confirm compliance validity." },
      { title: "Coach", desc: "Team training sessions, CPCB portal walkthroughs, and reporting workshops for compliance officers and auditors." },
      { title: "Control", desc: "Audit readiness reviews, gap analysis, and standardised reporting templates for transparent EPR compliance." },
    ],
    pricingTiers: [
      { name: "Compliance Basics", items: ["Regulatory update alerts", "Report templates", "Email support", "Quarterly newsletter"], cta: "Get Started", highlight: false },
      { name: "Compliance Professional", items: ["All Basics features", "Team training (up to 10)", "Audit readiness review", "Dedicated compliance advisor", "Certificate verification tools"], cta: "Most Popular — Contact Us", highlight: true },
      { name: "Compliance Enterprise", items: ["All Professional features", "Custom training programs", "On-site audit support", "Priority hotline", "Multi-department coverage"], cta: "Request Custom Quote", highlight: false }
    ],
    finalCta: { heading: "Stay Ahead of EPR Regulations", subheading: "Access guidelines, verification tools and expert training to stay compliant.", primaryCta: "Schedule Free Consultation", secondaryCta: "View EPR Guidelines", contact: "Contact our team:" }
  }
};

