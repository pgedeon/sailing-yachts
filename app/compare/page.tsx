import { CompareClient } from './CompareClient';

export const dynamic = 'force-dynamic';

export default async function ComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  const idsParam = searchParams.ids;
  const initialIds = idsParam ? idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
  return <CompareClient initialIds={initialIds} />;
}
