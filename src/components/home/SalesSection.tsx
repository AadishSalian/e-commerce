'use client';

import React from 'react';
import { SalesCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

export default function SalesSection() {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <section className="py-24 px-4 bg-[#121212]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4 text-center">
          {t('home.activeOffers') || 'Active Offers'}
        </h2>
        <p className="text-text-muted text-center mb-16 max-w-2xl mx-auto">
          {t('home.activeOffersSubtitle') || 'Exclusive deals on premium hardware and accessories. Limited quantities available.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          <SalesCard 
            title={t('home.seasonSale') || "Season Sale"} 
            text={t('home.seasonSaleText') || "Up to 50% off selected styles, while stocks last."}
            badgeValue="50%"
            badgeLabel="OFF"
            ctaText={t('home.shopSale') || "Shop Sale"}
            onClick={() => router.push('/products?sale=true')}
          />
          <SalesCard 
            title={t('home.bundleDeal') || "Bundle Deal"} 
            text={t('home.bundleDealText') || "Buy a keyboard and mouse, get a free desk mat."}
            badgeValue="FREE"
            badgeLabel="GIFT"
            ctaText={t('home.shopBundles') || "Shop Bundles"}
            onClick={() => router.push('/products?bundle=true')}
          />
          <SalesCard 
            title={t('home.earlyAccess') || "Early Access"} 
            text={t('home.earlyAccessText') || "Members get 24hr early access to the new collection."}
            badgeValue="24H"
            badgeLabel="VIP"
            ctaText={t('nav.signIn') || "Sign In"}
            onClick={() => router.push('/login')}
          />
        </div>
      </div>
    </section>
  );
}
