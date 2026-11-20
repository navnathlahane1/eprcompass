import type { PortalNavSection } from '@/components/portal/PortalShell';
import { interleaveDeepDive, type TourStep } from './tourTypes';
import { CLIENT_DASHBOARD_TOUR_STEPS } from './clientDashboardTourSteps';
import { LEGAL_DASHBOARD_TOUR_STEPS } from './legalDashboardTourSteps';
import { PARTNER_DASHBOARD_TOUR_STEPS } from './partnerDashboardTourSteps';
import { CEPC_DASHBOARD_TOUR_STEPS } from './cepcDashboardTourSteps';
import {
  PARTNER_CLIENTS_STEPS,
  PARTNER_LEADS_STEPS,
  PARTNER_FILINGS_STEPS,
  PARTNER_DOCUMENTS_STEPS,
  PARTNER_MY_DOCUMENTS_STEPS,
  PARTNER_COMMISSIONS_STEPS,
  PARTNER_TASKS_STEPS,
  PARTNER_PROFILE_STEPS,
  PARTNER_COMPLIANCE_STEPS,
  PARTNER_CALENDAR_STEPS,
  PARTNER_REFERRALS_STEPS,
  PARTNER_TRAINING_STEPS,
  PARTNER_ANNOUNCEMENTS_STEPS,
  PARTNER_TEAM_STEPS,
} from './partnerPagesTourSteps';

const FALLBACK_BODY = "Open this section to manage this part of your account. If you're not sure what to do here, use Help or the AI Assistant.";

function fromNavSections(navSections: PortalNavSection[], copy: Record<string, string>): TourStep[] {
  const steps: TourStep[] = [];
  for (const section of navSections) {
    for (const link of section.links) {
      steps.push({ id: link.href, title: link.label, body: copy[link.href] || FALLBACK_BODY });
    }
  }
  return steps;
}

// ─── Recycler Portal ────────────────────────────────────────────────────────

const RECYCLER_COPY: Record<string, string> = {
  '/recycler-portal/dashboard': 'Your home base. See new tender matches, live auctions, unread alerts, and pending requests as soon as you log in.',
  '/recycler-portal/training': "Short videos and guides that explain EPR recycling and how to use this portal. New here? Start with these.",
  '/recycler-portal/notifications': 'Every alert sent to you — new tenders, auction updates, document requests — all in one list.',
  '/recycler-portal/announcements': 'Official updates from the EPR Compass team: policy changes, new features, and important notices.',
  '/recycler-portal/ai-assistant': 'Ask a question in plain language and get instant help with CPCB filings, deadlines, or how anything in this portal works.',
  '/recycler-portal/tenders': 'Companies looking for a recycler post tenders here. Browse them and respond to the ones that match what you process.',
  '/recycler-portal/auctions': 'Live bidding events for recycling contracts. Join an auction to compete for the deal in real time.',
  '/recycler-portal/requests': 'Direct requests sent to you by companies (not through a tender). Accept, decline, or reply here.',
  '/recycler-portal/buyer-network': 'A directory of verified companies looking to buy recycled material or EPR credits from you.',
  '/recycler-portal/contracts': 'All the agreements you have signed with companies, in one place, with their status and key dates.',
  '/recycler-portal/meetings': 'Schedule and track calls or site visits with companies, buyers, or your compliance officer.',
  '/recycler-portal/credits': 'Buy, sell, or trade EPR credits here — the certificates that prove recycled tonnage on behalf of a company.',
  '/recycler-portal/tonnage': 'Log how much waste you have processed. This data is used for EPR credit calculations and compliance proof.',
  '/recycler-portal/invoices': 'View and download invoices for the tenders, auctions, and services you have completed.',
  '/recycler-portal/financing': 'Need funds to scale operations? Apply for credit financing linked to your future EPR credit sales.',
  '/recycler-portal/price-intelligence': 'See current market prices for EPR credits and recycled material, so you know what to charge or bid.',
  '/recycler-portal/collection': 'Manage the network of collectors and aggregators who supply raw waste material to you.',
  '/recycler-portal/traceability': 'A tamper-proof record of where each batch of waste came from and how it was processed — proof for audits.',
  '/recycler-portal/analytics': 'Charts and numbers showing your tonnage trends, revenue, and performance over time.',
  '/recycler-portal/capacity': 'Tell buyers how much processing capacity you have available each month, so they know you can take on work.',
  '/recycler-portal/cpcb-alerts': 'Time-sensitive notices from the Central Pollution Control Board that affect your authorisation or filings.',
  '/recycler-portal/cert-renewal': 'Track when your CPCB/SPCB authorisation certificate is due for renewal and start the renewal process here.',
  '/recycler-portal/authorizations': 'A list of all your official authorisations and permits, with their validity and status.',
  '/recycler-portal/cpcb-returns': 'File your periodic returns to the Central Pollution Control Board directly from this section.',
  '/recycler-portal/statutory-returns': 'Other statutory/regulatory returns you are required to file, tracked with due dates.',
  '/recycler-portal/tender-services': 'Paid support plans to help you find and win more government tenders.',
  '/recycler-portal/govt-tenders': 'Government (public sector) recycling tenders, separate from the private company tenders.',
  '/recycler-portal/filing-requests': 'Ask our team for help filing a specific compliance return, and track the request until it is done.',
  '/recycler-portal/my-documents': 'Upload and store your certificates, permits, and compliance documents — this is what gets you verified.',
  '/recycler-portal/contacts': 'Save contact details for the people and companies you work with regularly.',
  '/recycler-portal/reputation': 'See your rating and reviews from companies you have worked with — a strong reputation wins more tenders.',
  '/recycler-portal/team': 'Invite colleagues to your account and control what each of them can see or do.',
  '/recycler-portal/service-requests': 'Need help from our support team on anything? Raise a request here and track it to resolution.',
  '/recycler-portal/profile': 'Your business details: name, location, waste categories you handle, and registration information.',
};

export function buildRecyclerPortalTour(navSections: PortalNavSection[]): TourStep[] {
  return fromNavSections(navSections, RECYCLER_COPY);
}

// ─── Client / Brand Owner Portal ────────────────────────────────────────────

const CLIENT_COPY: Record<string, string> = {
  '/portal/compliance-hub': 'One place to see everything your company needs to do to stay EPR-compliant, all in one view.',
  '/portal/epr-tasks': 'Every upcoming EPR deadline and task, laid out on a calendar so nothing is missed.',
  '/portal/compliance-hub/tasks': 'A checklist of specific actions your team needs to complete for compliance, with due dates.',
  '/portal/compliance-hub/calendar': 'The filing calendar for all your quarterly and annual EPR submissions.',
  '/portal/compliance': 'A quick health-check view of your overall compliance status across every waste category.',
  '/portal/epr-checklist': 'Step-by-step checklist to confirm you have registered and filed correctly under EPR rules.',
  '/portal/compliance-vault': 'A secure, organised store for every compliance document you may need to produce during an audit.',
  '/portal/epr-credentials': 'Securely store your CPCB / State Pollution Control Board login details so filings can be done on your behalf.',
  '/portal/cpcb-sso': 'Register or link your company to the CPCB Single Sign-On portal used for official EPR filings.',
  '/portal/dashboard': 'Your home base — a snapshot of filings due, certificates, credits, and recent activity.',
  '/portal/certificates': 'View and download your EPR registration certificates for each waste category.',
  '/portal/filings': 'Track every EPR return you have filed, and their approval status.',
  '/portal/documents': 'Upload KYC and compliance documents: PAN, GST certificate, incorporation certificate, and more.',
  '/portal/epr-filings': 'A focused view of just your EPR filing status, so you can see at a glance what is pending.',
  '/portal/epr-documents': 'Documents specific to your EPR registration and filings, kept separate from general KYC documents.',
  '/portal/my-documents': 'A general folder for any document you want to keep on file within the portal.',
  '/portal/payments': 'Your billing history and payment methods for services and EPR credit purchases.',
  '/portal/credits': 'Buy EPR credits from verified recyclers to meet your annual recycling obligations.',
  '/portal/service-requests': 'Need help from our team on anything — filing, documents, credits? Raise a request here and track it.',
  '/portal/announcements': 'Official updates from the EPR Compass team: policy changes, new features, and important notices.',
  '/portal/data-profile': 'Enter your packaging quantities, product categories, and import/export volumes — this is what your EPR targets are calculated from.',
  '/portal/profile': 'Your company details: name, CIN, GSTIN, PAN, registered address, and authorised signatory.',
  '/portal/contacts': 'Invite colleagues from finance, compliance, or logistics who need access to this portal.',
  '/portal/team': 'Control what each team member can see or do inside the portal.',
  '/portal/help/general': 'Guides and answers for common questions about using this portal and understanding EPR compliance.',
};

export function buildClientPortalTour(navSections: PortalNavSection[]): TourStep[] {
  return interleaveDeepDive(fromNavSections(navSections, CLIENT_COPY), {
    '/portal/dashboard': CLIENT_DASHBOARD_TOUR_STEPS,
  });
}

// ─── Legal / Verification Partner Portal ────────────────────────────────────

const LEGAL_COPY: Record<string, string> = {
  '/legal-portal/dashboard': 'Your home base — a queue of recycler documents waiting for your legal review.',
  '/legal-portal/recyclers': 'The list of recyclers whose authorisation documents you need to verify before they go live on the platform.',
};

export function buildLegalPortalTour(navSections: PortalNavSection[]): TourStep[] {
  return interleaveDeepDive(fromNavSections(navSections, LEGAL_COPY), {
    '/legal-portal/dashboard': LEGAL_DASHBOARD_TOUR_STEPS,
  });
}

// ─── Channel Partner Portal ──────────────────────────────────────────────────

const PARTNER_COPY: Record<string, string> = {
  '/partner/dashboard': 'Your home base — a snapshot of your clients, leads, and commissions earned so far.',
  '/partner/clients': 'Every company you have referred that is now an active client, with their compliance status.',
  '/partner/leads': 'Companies you have referred that haven’t converted to a client yet — follow up on these.',
  '/partner/filings': 'Track the EPR filing status of the clients you referred.',
  '/partner/documents': 'Documents shared with you by clients or our team for your referred accounts.',
  '/partner/my-documents': 'Your own documents: partner agreement, KYC, and any certificates you have uploaded.',
  '/partner/commissions': 'See how much commission you have earned and what is still pending payout.',
  '/partner/tasks': 'Action items assigned to you — follow-ups, document requests, or client check-ins.',
  '/partner/profile': 'Your details: company name, partner type, state, city, and contact information.',
  '/partner/compliance': 'A quick view of how compliant your referred clients are overall.',
  '/partner/calendar': 'Upcoming meetings, deadlines, and follow-ups in one calendar view.',
  '/partner/referrals': 'Submit a new client referral here to start earning commission on the conversion.',
  '/partner/training': 'Onboarding training modules to help you understand EPR compliance and the referral process.',
  '/partner/announcements': 'Official updates from the EPR Compass team: policy changes, new features, and important notices.',
  '/partner/team': 'Invite colleagues to your partner account and control what each of them can access.',
  '/partner/help/dashboard': 'Guides and answers for common questions about referrals, commissions, and using this portal.',
};

export function buildPartnerPortalTour(navSections: PortalNavSection[]): TourStep[] {
  return interleaveDeepDive(fromNavSections(navSections, PARTNER_COPY), {
    '/partner/dashboard': PARTNER_DASHBOARD_TOUR_STEPS,
    '/partner/clients': PARTNER_CLIENTS_STEPS,
    '/partner/leads': PARTNER_LEADS_STEPS,
    '/partner/filings': PARTNER_FILINGS_STEPS,
    '/partner/documents': PARTNER_DOCUMENTS_STEPS,
    '/partner/my-documents': PARTNER_MY_DOCUMENTS_STEPS,
    '/partner/commissions': PARTNER_COMMISSIONS_STEPS,
    '/partner/tasks': PARTNER_TASKS_STEPS,
    '/partner/profile': PARTNER_PROFILE_STEPS,
    '/partner/compliance': PARTNER_COMPLIANCE_STEPS,
    '/partner/calendar': PARTNER_CALENDAR_STEPS,
    '/partner/referrals': PARTNER_REFERRALS_STEPS,
    '/partner/training': PARTNER_TRAINING_STEPS,
    '/partner/announcements': PARTNER_ANNOUNCEMENTS_STEPS,
    '/partner/team': PARTNER_TEAM_STEPS,
  });
}

// ─── CEPC Consultant Portal ──────────────────────────────────────────────────

const CEPC_COPY: Record<string, string> = {
  '/cepc/dashboard': 'Your home base — a snapshot of your certification tier, leads, and commissions so far.',
  '/cepc/training': "Training modules that qualify you as a Certified EPR Partner Consultant. Complete these to activate your account.",
  '/cepc/courses': 'Courses available to deepen your EPR consulting knowledge and unlock higher certification tiers.',
  '/cepc/certificates': 'View and download your CEPC certification and any course-completion certificates.',
  '/cepc/leads': 'Companies you have referred for EPR compliance help — track their status here.',
  '/cepc/commissions': 'See how much commission you have earned from your referred leads and what is still pending.',
  '/cepc/leaderboard': 'See how you rank against other CEPC consultants based on leads and conversions.',
  '/cepc/my-documents': 'Your own documents: certification proof, KYC, and any files you have uploaded.',
  '/cepc/profile': 'Your details: full name, phone number, state of operation, and consultant bio.',
  '/cepc/announcements': 'Official updates from the EPR Compass team: policy changes, new features, and important notices.',
  '/cepc/team': 'Invite colleagues to your consultant account and control what each of them can access.',
  '/cepc/help/dashboard': 'Guides and answers for common questions about certification, leads, and using this portal.',
};

export function buildCepcPortalTour(navSections: PortalNavSection[]): TourStep[] {
  return interleaveDeepDive(fromNavSections(navSections, CEPC_COPY), {
    '/cepc/dashboard': CEPC_DASHBOARD_TOUR_STEPS,
  });
}

