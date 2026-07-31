import React from 'react';
import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 md:px-8">
        {/* Title Area Skeleton */}
        <div className="flex flex-col gap-4 mb-12 max-w-2xl">
          <Skeleton className="w-24 h-4 rounded-md" />
          <Skeleton className="w-3/4 h-12 rounded-lg" />
          <Skeleton className="w-full h-6 rounded-md" />
        </div>
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
              <Skeleton className="w-2/3 h-5 rounded-md" />
              <Skeleton className="w-1/3 h-4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
