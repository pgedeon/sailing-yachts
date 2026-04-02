import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generateYachtsListMetadata } from '@/lib/seo';
import YachtsClient from './YachtsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateYachtsListMetadata();

export default function YachtsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading yachts...</div>}>
      <YachtsClient />
    </Suspense>
  );
}
