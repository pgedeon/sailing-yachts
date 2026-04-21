import { Metadata } from 'next';
import ApiDocsPage from './ApiDocsPage';

export const metadata: Metadata = {
  title: 'API Documentation',
  description:
    'Public REST API for sailing yacht data — browse endpoints, schemas, and interactive examples.',
  alternates: { canonical: '/api/docs' },
};

export default function Page() {
  return <ApiDocsPage />;
}
