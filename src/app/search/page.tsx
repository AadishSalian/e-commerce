import { Suspense } from 'react';
import SearchClient from './SearchClient';

export const metadata = {
  title: 'Search | MATTE.',
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background pt-32 pb-32 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
      </div>
    }>
      <SearchClient />
    </Suspense>
  );
}
