import { Metadata } from 'next';
import EprCountriesClient from './EprCountriesClient';

export const metadata: Metadata = {
  title: 'All Country EPR Pages | EPR Compass',
  description:
    'Browse and search EPR country pages across 60+ markets. Find country-specific regulation, authority and compliance guidance.',
};

export default function EprCountriesPage() {
  return <EprCountriesClient />;
}

