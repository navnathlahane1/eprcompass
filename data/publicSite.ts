export type PublicLink = {
  label: string;
  href: string;
  dropdown?: boolean;
  homeOnly?: boolean;
  innerOnly?: boolean;
};

export type FooterGroup = {
  title: string;
  links: PublicLink[];
};

export type OfficeLocation = {
  city: string;
  kind: string;
  address: string;
  phone: string;
  email: string;
};

export const publicNavigation: PublicLink[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Services", href: "/services", dropdown: true },
  { label: "EPR Solutions", href: "/epr-platform", dropdown: true },
  { label: "Resources", href: "/resources", dropdown: true },
  { label: "EPR by Country", href: "/epr-countries", innerOnly: true },
  { label: "Partners", href: "/become-a-partner", innerOnly: true },
  { label: "Blog", href: "/blog", homeOnly: true },
  { label: "Contact Us", href: "/contact" },
];

export const footerGroups: FooterGroup[] = [
  {
    title: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about-us" },
      { label: "Our Team", href: "/team" },
      { label: "Trust & access", href: "/trust" },
      { label: "Work with us", href: "/work-with-us" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "All EPR services", href: "/services" },
      { label: "EPR platform", href: "/epr-platform" },
      { label: "Credit trading", href: "/epr-credit-trading" },
      { label: "Recycler network", href: "/recycler-connect" },
      { label: "Consulting", href: "/services/epr-consulting" },
      { label: "Who it is for", href: "/who-is-it-for" },
      { label: "Industries", href: "/industries" },
      { label: "Global EPR", href: "/epr-countries" },
    ],
  },
  {
    title: "Free tools",
    links: [
      { label: "EPR fee calculator", href: "/epr-calculator" },
      { label: "Penalty checker", href: "/epr-penalty-checker" },
      { label: "Verify a certificate", href: "/verify" },
      { label: "Compliance checklist", href: "/compliance-checklist" },
      { label: "ROI calculator", href: "/roi-calculator" },
      { label: "Waste readiness quiz", href: "/waste-readiness-quiz" },
      { label: "Get matched", href: "/get-matched" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { label: "Credit marketplace", href: "/marketplace" },
      { label: "Consultants", href: "/join-network/consultants-marketplace" },
      { label: "Recyclers & PROs", href: "/join-network/recyclers-pro-network" },
      { label: "CEPC directory", href: "/cepc-directory" },
      { label: "For recyclers", href: "/for-recyclers" },
      { label: "Become a partner", href: "/become-a-partner" },
      { label: "Become a CEPC", href: "/become-a-cepc" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Resource hub", href: "/resources" },
      { label: "Blog", href: "/blog" },
      { label: "FAQs", href: "/faq" },
      { label: "EPR playbooks", href: "/resources/epr-playbooks" },
      { label: "Case studies", href: "/resources/client-case-studies" },
      { label: "Regulations", href: "/regulatory" },
      { label: "Courses", href: "/courses" },
      { label: "Trainings", href: "/trainings" },
      { label: "Webinar", href: "/webinar" },
    ],
  },
];

export const contactDetails = {
  phoneDisplay: "",
  phoneHref: "",
  email: "",
  emailHref: "",
  address: "",
};

export const offices: OfficeLocation[] = [];
