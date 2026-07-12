'use client';

import React from 'react';
import { SalesCard } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function SalesSection() {
  const router = useRouter();

  return (
    <section className="py-24 px-4 bg-[#121212]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4 text-center">
          Active Offers
        </h2>
        <p className="text-text-muted text-center mb-16 max-w-2xl mx-auto">
          Exclusive deals on premium hardware and accessories. Limited quantities available.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          <SalesCard 
            title="Season Sale" 
            text="Up to 50% off selected styles, while stocks last."
            badgeValue="50%"
            badgeLabel="OFF"
            ctaText="Shop Sale"
            onClick={() => router.push('/products?sale=true')}
          />
          <SalesCard 
            title="Bundle Deal" 
            text="Buy a keyboard and mouse, get a free desk mat."
            badgeValue="FREE"
            badgeLabel="GIFT"
            ctaText="Shop Bundles"
            onClick={() => router.push('/products?bundle=true')}
          />
          <SalesCard 
            title="Early Access" 
            text="Members get 24hr early access to the new collection."
            badgeValue="24H"
            badgeLabel="VIP"
            ctaText="Sign In"
            onClick={() => router.push('/login')}
          />
        </div>
      </div>
    </section>
  );
}
