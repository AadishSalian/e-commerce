import { Suspense } from 'react';
import SearchClient from './SearchClient';
import { Loader } from '@/components/ui/Loader';
import { WishlistButton } from '@/components/ui';

export const metadata = {
  title: 'Search | MATTE.',
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background pt-32 pb-32 flex items-center justify-center">
        <Loader size="lg" fullScreen={false} />
      </div>
    }>
      <SearchClient />
    </Suspense>
  );
}
