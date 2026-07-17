'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { ChevronDown, ArrowLeft } from 'lucide-react';

export default function SportsPage() {
  const [sortBy, setSortBy] = useState('newest');
  
  const filteredProducts = MOCK_PRODUCTS.filter(p => p.category === 'Sports')
  .sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0; // default 'newest'
  });

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="mb-16">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-foreground transition-colors mb-6 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Sports & Outdoors.
          </h1>
          <p className="text-text-muted text-lg max-w-2xl">
            High-performance gear designed for active lifestyles and extreme environments.
          </p>
        </div>

        {/* Filters & Sorting Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-12 border-y border-border py-4">
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium text-text-muted">Sort by</span>
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface border border-border text-foreground text-sm font-medium px-4 py-2 pr-10 rounded-full focus:outline-none focus:border-accent transition-colors"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
        >
          <AnimatePresence>
            {filteredProducts.map((product, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={product.id}
              >
                <Link href={`/products/${product.id}`} className="group block">
                  {/* Matte Flat Product Tile */}
                  <div className="w-full aspect-[4/5] bg-surface rounded-xl border border-transparent group-hover:border-border transition-colors duration-300 mb-6 flex flex-col p-6 relative overflow-hidden">
                    {product.isNew && (
                      <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-accent">
                        New
                      </span>
                    )}
                    {/* Placeholder for actual image */}
                    <div className="flex-1 w-full bg-surface-hover rounded-lg flex items-center justify-center">
                      <span className="text-xs text-text-muted uppercase tracking-widest">{product.name}</span>
                    </div>
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-foreground font-medium text-lg mb-1">{product.name}</h3>
                      <p className="text-text-muted text-sm">{product.variants.length > 0 ? `${product.variants.length} Colors` : '1 Color'}</p>
                    </div>
                    <p className="text-foreground font-medium text-lg">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-text-muted text-lg">No products found for this category.</p>
          </div>
        )}

      </div>
    </div>
  );
}
