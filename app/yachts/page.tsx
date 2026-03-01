import { Suspense } from 'react';
import { YachtsClient } from './YachtsClient';

export const dynamic = 'force-dynamic';

export default function YachtsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading yachts...</div>}>
      <YachtsClient />
    </Suspense>
  );
}
