// Standalone EPR Workshops — free, short-format, public
// These are the 4 original workshops shown on /trainings

import { Shield, Monitor, Leaf, Scale } from 'lucide-react';

export const STANDALONE_WORKSHOPS = [
  {
    id: 'pwm-rules',
    title: 'PWM Rules 2016 & 2022 — Essentials',
    subtitle: 'India\'s plastic waste law decoded for producers, importers and recyclers',
    icon: 'Shield',
    regulation: 'Plastic Waste Management Rules 2016 & 2022',
    wasteType: 'Plastic Waste',
    duration: '1–2 Days',
    sessions: 2,
    format: 'Online Live / In-person',
    price: 0,
    priceLabel: 'Free',
    description: 'A comprehensive workshop covering India\'s Plastic Waste Management Rules — the foundational legislation governing EPR for plastic packaging. Covers applicability, EPR targets, CPCB portal basics, and compliance documentation.',
    tagline: 'Master India\'s plastic waste law — EPR obligations, targets & filing basics',
    curriculum: [
      { title: 'Session 1 — PWM Rules Framework', topics: ['PWM Rules 2016 overview & 2022 amendments', 'Applicability: who is a producer, importer, brand owner', 'Plastic categories: rigid, flexible, multi-layered', 'EPR targets by year (2024–2030)', 'Key definitions: Extended Producer Responsibility, PRO, recycler'] },
      { title: 'Session 2 — Compliance Workflow', topics: ['CPCB EPR portal registration walkthrough', 'Form I & Form II overview', 'EPR credit procurement basics', 'PRO partnerships: selecting a registered PRO', 'Annual compliance calendar', 'Common non-compliance & penalties'] },
    ],
    includes: ['2 live sessions (recording for 7 days)', 'PWM Rules reference slides PDF', 'Compliance checklist', 'Q&A with an EPR Compass expert', 'Certificate of participation'],
    audience: ['Producers & importers of plastic-packaged goods', 'Legal & compliance teams', 'Recyclers understanding producer obligations', 'Students & consultants entering EPR'],
    upsell: { type: 'Certification', path: '/trainings/epr-compliance/plastic-epr-certification', label: 'Plastic Packaging EPR — Certification Course (₹2,999)' },
    testimonials: [
      { name: 'Rohan Gupta', role: 'Compliance Manager, FMCG Brand', text: 'Cleared all my confusion about PWM targets in one session. Excellent overview.' },
      { name: 'Priya Nair', role: 'EPR Consultant, Kochi', text: 'Perfect starting point before diving deeper. Signed up for Certification right after.' },
    ],
  },
  {
    id: 'epr-portal',
    title: 'EPR Portal Navigation & Filing',
    subtitle: 'Hands-on CPCB EPR portal walkthrough for producers and compliance teams',
    icon: 'Monitor',
    regulation: 'All EPR waste categories — CPCB portal',
    wasteType: 'All Categories',
    duration: '1 Day',
    sessions: 1,
    format: 'Online Live',
    price: 0,
    priceLabel: 'Free',
    description: 'A hands-on session navigating the CPCB EPR portal: producer registration, brand/SKU mapping, Form I & Form II submission, EPR credit upload, and certificate management. Practical screen-share walkthrough throughout.',
    tagline: 'Navigate the CPCB EPR portal with confidence — register, file and manage credits',
    curriculum: [
      { title: 'Session 1 — Full Portal Walkthrough', topics: ['Producer registration: step-by-step', 'Brand owner & importer registration differences', 'Product/SKU mapping in the portal', 'Annual plastic production/import declaration', 'EPR certificate upload workflow', 'Form I submission: live demonstration', 'Form II submission: live demonstration', 'EPR credit purchase & reconciliation', 'Certificate management & download', 'Common portal errors & how to fix them', 'Quarterly vs annual filing timelines'] },
    ],
    includes: ['1 live session (recording for 7 days)', 'Portal navigation quick-reference guide PDF', 'Filing checklist', 'Q&A with an EPR Compass expert', 'Certificate of participation'],
    audience: ['EPR compliance managers handling CPCB filings', 'New staff onboarding to EPR systems', 'Consultants filing on behalf of clients', 'Import businesses registering for the first time'],
    upsell: { type: 'Certification', path: '/trainings/epr-compliance/plastic-epr-certification', label: 'Plastic Packaging EPR — Certification Course (₹2,999)' },
    testimonials: [
      { name: 'Anil Sharma', role: 'EPR Manager, Electronics Brand', text: 'Finally understood the portal end to end. The screen share walkthrough was invaluable.' },
      { name: 'Meena Krishnan', role: 'Compliance Consultant', text: 'Saved me hours of trial and error. The filing checklist alone is worth attending for.' },
    ],
  },
  {
    id: 'plastic-waste-accounting',
    title: 'Plastic Waste Accounting & Targets',
    subtitle: 'Calculate your EPR targets, account for plastic packaging and close the gap',
    icon: 'Leaf',
    regulation: 'Plastic Waste Management Rules 2016 & 2022',
    wasteType: 'Plastic Waste',
    duration: '1–2 Days',
    sessions: 2,
    format: 'Online Live',
    price: 0,
    priceLabel: 'Free',
    description: 'A focused workshop on calculating EPR targets for plastic packaging, waste accounting methodology, and procuring EPR certificates to meet your obligations. Practical exercises included.',
    tagline: 'Calculate your plastic EPR targets, close the compliance gap and avoid penalties',
    curriculum: [
      { title: 'Session 1 — Target Setting & Accounting', topics: ['EPR target structure: category-wise breakdown', 'PWM target calculation methodology', 'Multi-year target roadmap (2024–2030)', 'Plastic packaging weight vs unit accounting', 'Gap analysis: current recycling vs required targets', 'Material flow mapping for producers', 'Import vs domestic manufacturing treatment'] },
      { title: 'Session 2 — Certificates & PRO Partnerships', topics: ['EPR certificate types: collection, recycling, processing', 'PRO selection criteria & due diligence', 'EPR credit price benchmarks', 'Certificate reconciliation with CPCB targets', 'Avoiding fraudulent certificates', 'Best practices for sustainable EPR compliance', 'Q&A with worked examples'] },
    ],
    includes: ['2 live sessions (recording for 7 days)', 'EPR target calculation worksheet (Excel)', 'PRO selection checklist', 'Q&A with an EPR Compass expert', 'Certificate of participation'],
    audience: ['Producers calculating EPR targets for the first time', 'Finance teams budgeting for EPR compliance', 'Consultants preparing EPR gap analysis reports', 'Sustainability managers benchmarking compliance'],
    upsell: { type: 'Certification', path: '/trainings/epr-compliance/plastic-epr-certification', label: 'Plastic Packaging EPR — Certification Course (₹2,999)' },
    testimonials: [
      { name: 'Sunita Joshi', role: 'Sustainability Head, Packaging Company', text: 'The target calculation worksheet was exactly what we needed for our board presentation.' },
      { name: 'Kiran Reddy', role: 'EPR Consultant, Bengaluru', text: 'Brilliant workshop for anyone confused about how targets actually work. Very practical.' },
    ],
  },
  {
    id: 'compliance-reporting',
    title: 'Compliance Reporting & EPR Credit Trading',
    subtitle: 'File annual EPR returns and trade credits across multiple waste categories',
    icon: 'Scale',
    regulation: 'Plastic, E-Waste, Battery, Tyre, Used Oil EPR Rules',
    wasteType: 'All Categories',
    duration: '1–2 Days',
    sessions: 2,
    format: 'Online Live',
    price: 0,
    priceLabel: 'Free',
    description: 'A cross-category workshop on annual EPR return filing (Form I & Form II), EPR credit trading mechanics, and certificate procurement across plastic, e-waste, battery, tyre, and used oil categories.',
    tagline: 'File accurate EPR returns and build a credit procurement strategy across all waste categories',
    curriculum: [
      { title: 'Session 1 — Annual Returns & Reporting', topics: ['Form I: annual production/import declaration — all categories', 'Form II: EPR compliance report — structure & fields', 'Supporting documents: what CPCB expects', 'Common filing mistakes & how to fix them', 'Late filing penalties across categories', 'Multi-category compliance calendar', 'Audit trail documentation best practices'] },
      { title: 'Session 2 — EPR Credit Trading', topics: ['EPR credit marketplace overview', 'Buying credits directly from recyclers vs via PRO', 'Credit price drivers by category', 'Due diligence on recycler certificates', 'Credit reconciliation & portal upload', 'Multi-category credit budget planning', 'Emerging exchange-based EPR credit trading', 'Q&A with live case studies'] },
    ],
    includes: ['2 live sessions (recording for 7 days)', 'Annual compliance calendar template', 'Credit procurement checklist', 'Multi-category filing guide PDF', 'Q&A with an EPR Compass expert', 'Certificate of participation'],
    audience: ['Compliance teams managing multi-category EPR obligations', 'Consultants filing for multiple clients', 'Finance teams managing EPR credit budgets', 'Anyone preparing for an EPR audit'],
    upsell: { type: 'Mastery', path: '/trainings/epr-compliance/plastic-epr-consulting', label: 'Plastic Packaging EPR — Consulting Mastery (₹15,000)' },
    testimonials: [
      { name: 'Deepak Sharma', role: 'CFO, D2C Brand', text: 'Understood EPR credit trading in 2 hours. This workshop saved us lakhs in overpaying for credits.' },
      { name: 'Anita Mehta', role: 'EPR Compliance Consultant', text: 'The multi-category compliance calendar template is something I use with every client now.' },
    ],
  },
];

export function resolveWorkshopSlug(slug) {
  return STANDALONE_WORKSHOPS.find(w => w.id === slug) || null;
}
