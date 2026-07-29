'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ForYouSection() {
  const { preferences } = usePreferences();
  const { recentProducts } = useRecentlyViewed();
  const { isLoggedIn } = useAuth();

  const recommendedProducts = useMemo(() => {
    // Basic recommendation algorithm
    // 1. Matches favorite categories
    // 2. Or is from the same category as recently viewed items
    const favCategories = preferences.favoriteCategories || [];
    const recentCategories = [...new Set(recentProducts.map(p => p.category))];
    
    const targetCategories = [...new Set([...favCategories, ...recentCategories])];
    
    if (targetCategories.length === 0) {
      // Return a random mix or popular items if no data
      return MOCK_PRODUCTS.slice(0, 4);
    }
    
    // Filter out items already in recently viewed (optional, or just show them)
    // We'll show a mix, but prioritize new items they haven't seen in the target categories
    const recommended = MOCK_PRODUCTS.filter(p => targetCategories.includes(p.category));
    
    // Sort to randomize a bit, or just take first 4
    return recommended.slice(0, 4);
  }, [preferences, recentProducts]);

  // If not logged in and no recent products, hide the section
  if (!isLoggedIn && recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-background overflow-hidden relative border-t border-border/50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Curated for You.
            </h2>
            <p className="text-lg text-text-muted">
              Based on your preferences and browsing history.
            </p>
          </div>
          <Link href="/products" className="hidden md:inline-flex items-center text-sm font-medium hover:text-accent transition-colors mt-6 md:mt-0 pb-1 border-b border-transparent hover:border-accent">
            View All Products
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Link href={`/products/${product.id}`} className="group block">
                <div className="relative aspect-[4/5] bg-surface rounded-2xl mb-4 overflow-hidden border border-border">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors duration-300" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-foreground font-semibold text-lg">{product.name}</h3>
                    <p className="text-text-muted text-sm capitalize">{product.category.replace('-', ' ')}</p>
                  </div>
                  <p className="text-foreground font-medium">${product.price.toFixed(2)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
