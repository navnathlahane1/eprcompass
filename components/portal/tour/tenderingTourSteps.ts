import type { TourStep } from '@/components/portal/tour/usePortalTour';

export const TENDERING_TOUR_STEPS: TourStep[] = [
  { id: '/tendering/dashboard', title: 'Dashboard', body: 'A quick overview of tendering activity — active tenders, bids, and deadlines.' },
  { id: '/tendering/my-tenders', title: 'My Tenders', body: 'The tenders assigned to you, so you always know what to work on next.' },
  { id: '/tendering/bids', title: 'Bids', body: 'Track the bids you’ve submitted and their current status.' },
  { id: '/tendering/calendar', title: 'Calendar', body: 'A calendar view of tender submission deadlines and important dates.' },
  { id: '/tendering/tenders', title: 'All Tenders', body: 'The full list of every EPR tender being tracked across the business.' },
  { id: '/tendering/tenders/new', title: 'New Tender', body: 'Add a newly discovered tender opportunity into the system.' },
  { id: '/tendering/tenders/shortlisted', title: 'Shortlisted', body: 'Tenders the team has shortlisted as worth pursuing.' },
  { id: '/tendering/tenders/submitted', title: 'Submitted', body: 'Tenders where a bid has already been submitted and is awaiting a result.' },
  { id: '/tendering/bid-tracker', title: 'Bid Tracker', body: 'Follow each bid through its stages, from preparation to award.' },
  { id: '/tendering/evaluation/technical', title: 'Technical Eval', body: 'Score and review the technical requirements of a tender before bidding.' },
  { id: '/tendering/evaluation/financial', title: 'Financial Eval', body: 'Assess the financial terms and viability of a tender before committing to bid.' },
  { id: '/tendering/vendors', title: 'Vendors', body: 'The directory of vendor and partner organisations used when preparing bids.' },
  { id: '/tendering/contracts', title: 'Contracts', body: 'Manage contracts that result from tenders won.' },
  { id: '/tendering/documents', title: 'Documents', body: 'Store and access the documents needed for tender submissions.' },
  { id: '/tendering/govt-tenders', title: 'Govt Tenders', body: 'Government-issued tenders specifically, tracked separately for easy monitoring.' },
  { id: '/tendering/recycler-subscriptions', title: 'Subscriptions', body: 'Manage recycler subscription plans tied to the tendering business.' },
  { id: '/tendering/filing-requests', title: 'Filing Requests', body: 'Requests from clients or teams to file paperwork related to a tender or contract.' },
  { id: '/tendering/analytics', title: 'Analytics', body: 'Win rates, bid values, and other performance metrics for the tendering team.' },
  { id: '/tendering/compliance', title: 'Compliance', body: 'Checks that tenders and contracts meet regulatory and internal compliance requirements.' },
  { id: '/tendering/settings', title: 'Settings', body: 'Configure tendering portal preferences and account settings.' },
];
