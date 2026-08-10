'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { Eye, Layers } from 'lucide-react';
import { useQuickView } from '@/contexts/QuickViewContext';
import { useCompare } from '@/contexts/CompareContext';
import ProductCard from '@/components/product/ProductCard';

export default function ProductCarousel() {
  const { openQuickView } = useQuickView();
  const { addToCompare } = useCompare();
  // Get some featured products from MOCK_PRODUCTS
  const featuredProducts = MOCK_PRODUCTS.slice(0, 5);

  return (
    <section className="w-full py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8 mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Featured Products</h2>
          <p className="text-text-muted">Explore our signature matte collection.</p>
        </div>
        <Link href="/products" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
          View All
        </Link>
      </div>

      {/* Snap Scroll Container */}
      <div className="w-full overflow-x-auto pb-8 hide-scrollbar snap-x snap-mandatory px-4 md:px-8 flex gap-6">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} variant="carousel" />
        ))}
      </div>
    </section>
  );
}
