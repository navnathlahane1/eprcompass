export type PortalLocale = 'en' | 'hi' | 'ar';

const dictionaries: Record<PortalLocale, Record<string, string>> = {
  en: {
    'portal.dashboard.myCompany': 'My Company',
    'portal.dashboard.companyProfile': 'Company Profile',
    'portal.dashboard.myContacts': 'My Contacts',
    'portal.dashboard.activityHistory': 'Activity History',
    'portal.dashboard.accountNo': 'Account No',
    'portal.dashboard.complianceStatus': 'Compliance Status',
    'portal.dashboard.assignedManager': 'Assigned Manager',
    'portal.dashboard.complianceSummary': 'Compliance Summary',
    'portal.dashboard.viewAllFilings': 'View filing calendar',
    'portal.dashboard.complianceScore': 'Compliance Score',
    'portal.dashboard.pendingDocuments': 'Pending Documents',
    'portal.dashboard.outstandingPayments': 'Outstanding Payments',
    'portal.dashboard.openServices': 'Open Services',
    'portal.dashboard.upcomingDeadlines': 'Upcoming Deadlines',
    'portal.dashboard.noDeadlines': 'No deadlines in the upcoming period.',
    'portal.dashboard.reviewFiling': 'Review filing',
    'portal.dashboard.recentActivity': 'Recent Activity',
    'portal.dashboard.seeFullHistory': 'See full history',
    'portal.dashboard.noRecentActivity': 'No recent activity yet.',
    'portal.dashboard.compliant': 'Compliant',
    'portal.dashboard.nonCompliant': 'Non-Compliant',
    'portal.dashboard.atRisk': 'At Risk',
    'portal.dashboard.risk': 'Risk',
    'portal.dashboard.due': 'Due',
    'portal.dashboard.daysLeft': 'day(s) left',
    'portal.dashboard.progressCta': 'Open filings',
    'portal.dashboard.portalOverview': 'Portal Overview',
    'portal.dashboard.eprProgress': 'EPR Category Progress'
  },
  hi: {},
  ar: {}
};

export function t(key: string, locale: PortalLocale = 'en') {
  return dictionaries[locale]?.[key] || dictionaries.en[key] || key;
}

export function getDirection(locale: PortalLocale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function formatPortalCurrency(value: number, locale: PortalLocale = 'en', currency = 'INR') {
  const localeTag = locale === 'hi' ? 'hi-IN' : locale === 'ar' ? 'ar-AE' : 'en-IN';
  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function formatPortalDate(value: string, locale: PortalLocale = 'en', withTime = false) {
  const localeTag = locale === 'hi' ? 'hi-IN' : locale === 'ar' ? 'ar-AE' : 'en-IN';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(localeTag, {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {})
  }).format(date);
}
