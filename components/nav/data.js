import {
  Briefcase,
  Target,
  FileText,
  Building2,
  ClipboardList,
  BadgeCheck,
  Shield,
  Users,
  GraduationCap,
  TrendingUp,
  Leaf,
  MessageCircle,
  Monitor,
  Megaphone,
  Calendar,
  Anchor,
  Wrench,
  Droplets,
  Package,
  RefreshCw,
  CheckCircle,
  ClipboardCheck,
  ShoppingBag,
  MonitorSmartphone,
  BatteryCharging,
  CircleDot,
  Fuel,
  Car,
  HardHat,
  BookOpen,
  Factory,
} from "lucide-react";

import { regulatoryLinks as sharedRegulatoryLinks } from "@/lib/regulatoryLinks";

export const regulatoryLinks = sharedRegulatoryLinks;

// EPR Academy mega-menu — persona-aligned course paths
export const academyPrograms = [
  {
    label: "For Recyclers & PROs",
    icon: RefreshCw,
    href: "/courses/for-recyclers-pros",
    badge: "Recyclers",
    badgeColor: "bg-emerald-100 text-emerald-700",
    desc: "Generate more EPR credits, win corporate contracts and expand to new waste streams — built for verified recyclers and PROs",
    persona: "recyclers",
  },
  {
    label: "For PIBOs & Corporates",
    icon: Factory,
    href: "/courses/for-pibs-corporates",
    badge: "PIBO",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Know your plastic, e-waste & battery obligations, calculate EPR targets and avoid CPCB penalties",
    persona: "pibo",
  },
  {
    label: "For Students & Freshers",
    icon: GraduationCap,
    href: "/courses/cepc",
    badge: "Career",
    badgeColor: "bg-indigo-100 text-indigo-700",
    desc: "Launch a career in EPR compliance — get CEPC certified and start earning as a consultant",
    persona: "students",
  },
  {
    label: "For Consultants & Trainers",
    icon: TrendingUp,
    href: "/courses/ealp",
    badge: "Agency",
    badgeColor: "bg-amber-100 text-amber-700",
    desc: "Build a scalable EPR consulting practice or deliver training under your own brand with 20% revenue share",
    persona: "consultants",
  },
];

// kept for backward-compat (MobileMenu still uses this name)
export const trainingCategories = [
  { label: "Courses for Recyclers & PROs", icon: RefreshCw, href: "/courses/for-recyclers-pros" },
  { label: "Courses for PIBOs & Corporates", icon: Factory, href: "/courses/for-pibs-corporates" },
  { label: "Courses for Students & Freshers", icon: GraduationCap, href: "/courses/cepc" },
  { label: "Courses for Consultants & Trainers", icon: TrendingUp, href: "/courses/ealp" },
  { label: "Training Calendar", icon: Calendar, href: "/training_calendar" },
  { label: "All Courses & Workshops", icon: Monitor, href: "/trainings" },
];

export const webinarHighlight = {
  label: "Live EPR Compliance Webinar",
  icon: Megaphone,
  href: "/webinar",
  badge: "LIVE",
  description:
    "Join our live webinar on EPR compliance. Learn from industry experts. Free registration with certificate of participation.",
};

export const legalPolicyLinks = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund & Cancellation", href: "/refund-cancellation-policy" },
  { label: "Shipping & Delivery", href: "/shipping-delivery-policy" },
  { label: "Results Disclaimer", href: "/results-earnings-disclaimer" },
  { label: "Contact Us", href: "/contact" },
];

export const partnerLinks = [
  { label: "Become a Partner", href: "/become-a-partner", icon: Users, desc: "Refer PIBOs and earn on registrations and filings" },
  { label: "Become a CEPC", href: "/become-a-cepc", icon: GraduationCap, desc: "Certified EPR Professional Consultant programme" },
  { label: "Join as a trainer", href: "/join-network/join-as-trainer", icon: Megaphone, desc: "Deliver academy batches under your brand" },
  { label: "About EPR Compass", href: "/about-us", icon: Building2, desc: "Who we are and how the network works" },
];

export const learnResourceLinks = [
  { label: "EPR Playbooks", href: "/resources/epr-playbooks" },
  { label: "PWM Rules Digest", href: "/resources/pwm-rules-digest" },
  { label: "CPCB Update Alerts", href: "/resources/cpcb-update-alerts" },
  { label: "Client Case Studies", href: "/resources/client-case-studies" },
  { label: "Expert FAQs", href: "/resources/expert-faqs" },
  { label: "Resource Hub", href: "/resources" },
];

export const learnCountryLinks = [
  { label: "India EPR", href: "/epr/india" },
  { label: "Global coverage", href: "/global-coverage" },
  { label: "All country pages", href: "/epr-countries" },
];

export const featuredIndustries = [
  { label: "FMCG & Consumer Brands", href: "/industries/fmcg-consumer-brands", icon: ShoppingBag },
  { label: "E-commerce & Retail", href: "/industries/ecommerce-retail", icon: ShoppingBag },
  { label: "Electronics & EEE", href: "/industries/electronics-eee", icon: MonitorSmartphone },
  { label: "Battery Producers", href: "/industries/battery-producers-importers", icon: BatteryCharging },
  { label: "Tyre Manufacturers", href: "/industries/tyre-manufacturers-importers", icon: Car },
  { label: "Automotive OEM & ELV", href: "/industries/automotive-oem-elv", icon: Car },
  { label: "Packaging Converters", href: "/industries/packaging-converters-manufacturers", icon: Package },
  { label: "Pharmaceuticals", href: "/industries/pharmaceuticals-healthcare", icon: Droplets },
];

export const marketplaceLinks = [
  {
    label: "EPR Credit Trading",
    href: "/epr-credit-trading",
    icon: TrendingUp,
    desc: "Buy & sell verified EPR credits across plastic, e-waste, battery & tyre streams",
    badge: "Live",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Find a consultant",
    href: "/join-network/consultants-marketplace",
    icon: Briefcase,
    desc: "Vetted EPR consultants matched to your category and geography",
    badge: "200+ Listed",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    label: "Recyclers & PROs",
    href: "/join-network/recyclers-pro-network",
    icon: RefreshCw,
    desc: "Certified recyclers and PROs for credit generation and collection",
    badge: "Directory",
    badgeColor: "bg-teal-100 text-teal-700",
  },
];

export const marketplaceExtraLink = {
  label: "Requirements board",
  href: "/marketplace/requirements",
};

export const toolsMenu = [
  {
    label: "Penalty Checker",
    href: "/epr-penalty-checker",
    icon: Shield,
    desc: "See if CPCB/SPCB has a notice against your company",
    badge: "Free",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    label: "EPR Fee Calculator",
    href: "/epr-calculator",
    icon: TrendingUp,
    desc: "Estimate registration and filing cost in 2 minutes",
    badge: "Popular",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  {
    label: "Compliance Checklist",
    href: "/compliance-checklist",
    icon: ClipboardCheck,
    desc: "What documents and filings you need this FY",
  },
  {
    label: "Verify a Certificate",
    href: "/verify",
    icon: BadgeCheck,
    desc: "Confirm an EPR Compass compliance record by public ID",
    badge: "Trust",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    label: "Waste Readiness Quiz",
    href: "/waste-readiness-quiz",
    icon: CheckCircle,
    desc: "60-second score of how ready you are to file",
  },
];

export const conversionActions = [
  { label: "Get Matched to a Compliance Plan", icon: Target, href: "/get-matched", desc: "2-min intake to map your business to the right EPR path" },
  { label: "Estimate Liability & Budget", icon: TrendingUp, href: "/epr-calculator", desc: "Use category and quantity data to model obligations" },
  { label: "Contact us", icon: MessageCircle, href: "/contact", desc: "Send us your EPR requirement" },
];

export const solutionColumns = [
  {
    heading: "Registrations",
    items: [
      { label: "Registration services", icon: BadgeCheck, href: "/services/registration-services" },
      { label: "Producer EPR registration", icon: Building2, href: "/services/producer-epr-registration" },
      { label: "Importer EPR registration", icon: Package, href: "/services/importer-epr-registration" },
      { label: "Brand owner EPR registration", icon: Users, href: "/services/brand-owner-epr-registration" },
      { label: "PRO registration", icon: RefreshCw, href: "/services/pro-registration" },
    ],
  },
  {
    heading: "Waste streams",
    items: [
      { label: "Plastic packaging EPR", icon: Package, href: "/services/plastic-packaging-epr" },
      { label: "E-waste EPR", icon: Shield, href: "/services/e-waste-epr" },
      { label: "Battery waste EPR", icon: Shield, href: "/services/battery-waste-epr" },
      { label: "Tyre waste EPR", icon: Wrench, href: "/services/tyre-waste-epr" },
      { label: "ELV EPR", icon: Anchor, href: "/services/elv-epr" },
      { label: "Used oil EPR", icon: Droplets, href: "/services/used-oil-epr" },
    ],
  },
  {
    heading: "Annual filing",
    items: [
      { label: "Compliance services", icon: Shield, href: "/services/compliance-services" },
      { label: "Annual EPR returns", icon: FileText, href: "/services/annual-epr-returns" },
      { label: "Portal filing support", icon: CheckCircle, href: "/services/portal-filing-support" },
      { label: "EPR audits", icon: ClipboardList, href: "/services/epr-audits" },
    ],
  },
  {
    heading: "For your industry",
    items: featuredIndustries.map((item) => ({
      label: item.label,
      icon: item.icon,
      href: item.href,
    })),
    footer: { label: "All industries", href: "/industries" },
  },
];

export const whoIsItForSections = [
  {
    header: "Producers & Manufacturers",
    slug: "producers-manufacturers",
    icon: Building2,
    items: [
      { label: "Plastic product manufacturers", slug: "plastic-product-manufacturers" },
      { label: "Packaging manufacturers", slug: "packaging-manufacturers" },
      { label: "FMCG companies", slug: "fmcg-companies" },
      { label: "Electronics manufacturers", slug: "electronics-manufacturers" },
      { label: "Automobile manufacturers", slug: "automobile-manufacturers" },
      { label: "Pharmaceutical companies", slug: "pharmaceutical-companies" },
    ],
  },
  {
    header: "Brand Owners & Importers",
    slug: "brand-owners-importers",
    icon: Package,
    items: [
      { label: "E-commerce companies", slug: "ecommerce-companies" },
      { label: "Retail chains", slug: "retail-chains" },
      { label: "Import/export businesses", slug: "import-export-businesses" },
      { label: "Brand owners", slug: "brand-owners" },
      { label: "Distributors", slug: "distributors" },
    ],
  },
  {
    header: "Recyclers & PROs",
    slug: "recyclers-pros",
    icon: RefreshCw,
    items: [
      { label: "Plastic waste recyclers", slug: "plastic-waste-recyclers" },
      { label: "Producer Responsibility Organizations (PROs)", slug: "producer-responsibility-organizations" },
      { label: "Waste management companies", slug: "waste-management-companies" },
      { label: "Collection centers", slug: "collection-centers" },
      { label: "Aggregators", slug: "aggregators" },
    ],
  },
  {
    header: "Government & Compliance",
    slug: "government-compliance",
    icon: Shield,
    items: [
      { label: "State Pollution Control Boards", slug: "state-pollution-control-board" },
      { label: "Central Pollution Control Board (CPCB)", slug: "central-pollution-control-board" },
      { label: "Environmental consultants", slug: "environmental-consultants" },
      { label: "Compliance auditors", slug: "compliance-auditors" },
      { label: "NGOs", slug: "ngos" },
    ],
  },
];

export const globalEprSections = [
  {
    heading: "Explore",
    links: [
      { label: "Global Coverage", href: "/global-coverage" },
      { label: "All Country Pages", href: "/epr-countries" },
    ],
  },
  {
    heading: "Europe",
    links: [
      { label: "Germany", href: "/epr/germany" },
      { label: "France", href: "/epr/france" },
      { label: "United Kingdom", href: "/epr/united-kingdom" },
      { label: "Italy", href: "/epr/italy" },
    ],
  },
  {
    heading: "Asia-Pacific",
    links: [
      { label: "India", href: "/epr/india" },
      { label: "Singapore", href: "/epr/singapore" },
      { label: "Australia", href: "/epr/australia" },
      { label: "Japan", href: "/epr/japan" },
    ],
  },
  {
    heading: "Americas",
    links: [
      { label: "United States", href: "/epr/united-states" },
      { label: "Canada", href: "/epr/canada" },
      { label: "Brazil", href: "/epr/brazil" },
      { label: "Mexico", href: "/epr/mexico" },
    ],
  },
];

export const industryMenuSections = [
  {
    heading: "Consumer & Retail",
    icon: ShoppingBag,
    links: [
      { label: "FMCG & Consumer Brands", href: "/industries/fmcg-consumer-brands" },
      { label: "E-commerce & Retail", href: "/industries/ecommerce-retail" },
      { label: "Food & Beverage Processing", href: "/industries/food-beverage-processing" },
      { label: "Cosmetics & Personal Care", href: "/industries/cosmetics-personal-care" },
      { label: "Hospitality & Institutional Procurement", href: "/industries/hospitality-institutional-procurement" },
    ],
  },
  {
    heading: "Electronics & Energy",
    icon: MonitorSmartphone,
    links: [
      { label: "Electronics & EEE", href: "/industries/electronics-eee" },
      { label: "Battery Producers & Importers", href: "/industries/battery-producers-importers" },
      { label: "White Goods & Home Appliances", href: "/industries/white-goods-home-appliances" },
      { label: "Telecom & IT Hardware", href: "/industries/telecom-it-hardware" },
      { label: "Solar & Renewable Energy Equipment", href: "/industries/solar-renewable-energy-equipment" },
    ],
  },
  {
    heading: "Mobility & Materials",
    icon: Car,
    links: [
      { label: "Tyre Manufacturers & Importers", href: "/industries/tyre-manufacturers-importers" },
      { label: "Used Oil & Lubricants", href: "/industries/used-oil-lubricants" },
      { label: "Automotive OEM & ELV", href: "/industries/automotive-oem-elv" },
      { label: "Construction & Non-Ferrous", href: "/industries/construction-non-ferrous" },
      { label: "Chemicals & Industrial Manufacturing", href: "/industries/chemicals-industrial-manufacturing" },
      { label: "Packaging Converters & Manufacturers", href: "/industries/packaging-converters-manufacturers" },
      { label: "Textiles, Apparel & Footwear", href: "/industries/textiles-apparel-footwear" },
      { label: "Pharmaceuticals & Healthcare", href: "/industries/pharmaceuticals-healthcare" },
    ],
  },
];

export const industryHighlights = [
  {
    label: "Multi-Stream EPR Mapping",
    icon: CircleDot,
    href: "/industries",
    desc: "Instantly see where Plastic, E-Waste, Battery, Tyre, Used Oil and ELV obligations overlap.",
  },
  {
    label: "Deadline Risk Snapshot",
    icon: BatteryCharging,
    href: "/industries",
    desc: "Prioritize filings fast based on your product mix and current applicability pressure.",
  },
  {
    label: "Industry Action Plans",
    icon: Fuel,
    href: "/industries",
    desc: "Use role-based execution steps for compliance, legal and operations teams.",
  },
  {
    label: "Free Applicability Audit",
    icon: HardHat,
    href: "/contact?intent=meeting&source=industry_audit_nav",
    desc: "Book a focused call and get your industry applicability mapped to next actions.",
  },
];

export const solutionMobileLinks = solutionColumns.flatMap((column) =>
  column.items.map((item) => ({ label: item.label, icon: item.icon, href: item.href })),
);

