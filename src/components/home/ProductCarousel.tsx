'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { Eye, Layers } from 'lucide-react';
import { useQuickView } from '@/contexts/QuickViewContext';
import { useCompare } from '@/contexts/CompareContext';

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
          <motion.div
            key={product.id}
            whileHover={{ y: -4, borderColor: 'var(--border-hover, #3a3a3a)' }}
            className="snap-start shrink-0 w-[280px] md:w-[320px] aspect-[4/5] bg-surface rounded-xl border border-border flex flex-col p-6 transition-all duration-300 relative group cursor-pointer"
          >
            <div className="flex-1 bg-surface-hover rounded-lg mb-6 flex items-center justify-center overflow-hidden relative">
               <img 
                 src={product.image} 
                 alt={product.name} 
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               />
               
               {/* Action Buttons */}
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                 <button 
                   onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product); }}
                   className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
                   title="Quick View"
                 >
                   <Eye className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(product); }}
                   className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
                   title="Compare"
                 >
                   <Layers className="w-5 h-5" />
                 </button>
               </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{product.category}</p>
                <h3 className="text-foreground font-medium">{product.name}</h3>
              </div>
              <p className="text-foreground font-medium">${product.price}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
