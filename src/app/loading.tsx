import React from 'react';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-16">
      <ProductGridSkeleton count={9} />
    </div>
  );
}
