import type { Metadata } from 'next';
import { SearchClient } from './SearchClient';

export const metadata: Metadata = {
  title: 'Search Yachts — Sailing Yachts Database',
  description:
    'Search sailing yachts by manufacturer, model name, rig type, keel type, and more. Find the perfect sailboat with our comprehensive database.',
  openGraph: {
    title: 'Search Sailing Yachts',
    description:
      'Search and find sailing yachts by manufacturer, model, and specifications.',
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
