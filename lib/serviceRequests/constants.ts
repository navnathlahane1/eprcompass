/** Central constants for the Service Request workflow */

export const SERVICE_CATEGORIES = [
  'New EPR Registration',
  'Amendment Request',
  'Annual Return Filing',
  'Plastic EPR Support',
  'Battery EPR',
  'E-Waste Compliance',
  'Tyre EPR',
  'Import License Support',
  'CPCB Documentation',
  'Legal / Consultation',
  'Recycler Empanelment',
  'EPR Compass Renewal',
  'Compliance Audit Support',
  'Custom Service',
] as const;

export const PRIORITIES = ['Urgent', 'High', 'Normal', 'Low'] as const;

export const STATUSES = [
  'Submitted',
  'Under Review',
  'Awaiting Pricing',
  'Quote Sent',
  'Client Approved',
  'Client Rejected',
  'In Progress',
  'Completed',
  'Closed',
] as const;

export type ServiceRequestStatus = typeof STATUSES[number];
export type ServiceRequestPriority = typeof PRIORITIES[number];

export const STATUS_COLORS: Record<ServiceRequestStatus, string> = {
  'Submitted':       'bg-blue-100 text-blue-700',
  'Under Review':    'bg-indigo-100 text-indigo-700',
  'Awaiting Pricing':'bg-amber-100 text-amber-700',
  'Quote Sent':      'bg-purple-100 text-purple-700',
  'Client Approved': 'bg-emerald-100 text-emerald-700',
  'Client Rejected': 'bg-red-100 text-red-700',
  'In Progress':     'bg-teal-100 text-teal-700',
  'Completed':       'bg-green-100 text-green-700',
  'Closed':          'bg-gray-100 text-gray-600',
};

export const PRIORITY_COLORS: Record<ServiceRequestPriority, string> = {
  'Urgent': 'bg-red-100 text-red-700',
  'High':   'bg-orange-100 text-orange-700',
  'Normal': 'bg-blue-100 text-blue-700',
  'Low':    'bg-gray-100 text-gray-600',
};

/** Statuses where the client can approve/reject the quote */
export const CLIENT_ACTION_STATUSES: ServiceRequestStatus[] = ['Quote Sent'];

/** Statuses admin can transition TO from a given current status */
export const ADMIN_NEXT_STATUSES: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  'Submitted':        ['Under Review', 'Awaiting Pricing', 'Closed'],
  'Under Review':     ['Awaiting Pricing', 'In Progress', 'Closed'],
  'Awaiting Pricing': ['Quote Sent', 'Closed'],
  'Quote Sent':       ['Awaiting Pricing', 'In Progress', 'Closed'],
  'Client Approved':  ['In Progress', 'Completed'],
  'Client Rejected':  ['Awaiting Pricing', 'Closed'],
  'In Progress':      ['Completed', 'Closed'],
  'Completed':        ['Closed'],
  'Closed':           [],
};

