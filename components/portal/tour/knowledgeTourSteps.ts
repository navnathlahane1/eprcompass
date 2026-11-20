import type { TourStep } from '@/components/portal/tour/usePortalTour';

export const KNOWLEDGE_TOUR_STEPS: TourStep[] = [
  { id: '/knowledge/dashboard', title: 'Dashboard', body: 'An overview of the Knowledge Hub — recent documents, activity, and what’s new.' },
  { id: '/knowledge/library', title: 'Library', body: 'Browse every document, guide, and training resource stored in the knowledge base.' },
  { id: '/knowledge/upload', title: 'Upload', body: 'Add new documents or resources to the knowledge base for others to find.' },
  { id: '/knowledge/categories', title: 'Categories', body: 'Organize the library into categories so documents are easy to browse and find.' },
];
