'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { getLocalizedProduct } from '@/lib/i18n/catalogLocalization';
import { LiquidShaderImage } from '@/components/ui';

export default function ForYouSection() {
  const { preferences } = usePreferences();
  const { recentProducts } = useRecentlyViewed();
  const { isLoggedIn } = useAuth();
  const { t, locale, formatPrice } = useLocale();

  const recommendedProducts = useMemo(() => {
    const favCategories = preferences.favoriteCategories || [];
    const recentCategories = [...new Set(recentProducts.map(p => p.category))];
    const targetCategories = [...new Set([...favCategories, ...recentCategories])];
    
    if (targetCategories.length === 0) {
      return MOCK_PRODUCTS.slice(0, 4);
    }
    
    const recommended = MOCK_PRODUCTS.filter(p => targetCategories.includes(p.category));
    return recommended.slice(0, 4);
  }, [preferences, recentProducts]);

  if (!isLoggedIn && recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-background overflow-hidden relative border-t border-border/50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              {t('home.forYou') || 'Curated for You.'}
            </h2>
            <p className="text-lg text-text-muted">
              {t('home.forYouDesc') || 'Based on your preferences and browsing history.'}
            </p>
          </div>
          <Link href="/products" className="hidden md:inline-flex items-center text-sm font-medium hover:text-accent transition-colors mt-6 md:mt-0 pb-1 border-b border-transparent hover:border-accent">
            {t('home.viewAll') || 'View All Products'}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {recommendedProducts.map((product, index) => {
            const locProd = getLocalizedProduct(product.id, product, locale);
            const priceObj = formatPrice(product.price);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link href={`/products/${product.id}`} className="group block">
                  <div className="relative aspect-[4/5] bg-surface rounded-xl mb-4 overflow-hidden border border-border">
                    <LiquidShaderImage 
                      src={product.image}
                      hoverSrc={product.hoverImage}
                      alt={locProd.name}
                      fill
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors duration-300" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-foreground font-medium text-sm md:text-base leading-tight truncate flex-1">{locProd.name}</h3>
                      <p className="text-foreground font-bold text-sm md:text-base">{priceObj.formatted}</p>
                    </div>
                    <p className="text-text-muted text-xs capitalize truncate">{locProd.category || product.category.replace('-', ' ')}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
