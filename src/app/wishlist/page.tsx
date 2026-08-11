'use client';

import { Heart, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { useWishlist } from '@/contexts/WishlistContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Your Mood Board.
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            A curated collection of your favorite engineered objects.
          </p>
        </div>
        {wishlistItems.length > 0 && (
          <p className="text-sm font-medium text-text-muted">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
          </p>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="border-t border-border pt-24 pb-32">
          <EmptyState 
            icon={<Heart className="w-12 h-12" />} 
            title="Nothing saved yet." 
            description="Curate your perfect setup. Start exploring our collections to find your next obsession." 
            actionText="Start Browsing" 
            actionHref="/products" 
          />
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 auto-rows-[300px] md:auto-rows-[400px]"
        >
          <AnimatePresence>
            {wishlistItems.map((product, idx) => {
              // Create an asymmetrical layout based on index
              const isLarge = idx % 5 === 0; // Every 5th item is large
              const isWide = idx % 7 === 3; // Some items are wide

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.5, delay: idx * 0.05, type: 'spring' }}
                  key={product.id}
                  className={`group relative rounded-2xl overflow-hidden bg-surface flex flex-col cursor-pointer ${
                    isLarge ? 'md:col-span-2 md:row-span-2' : isWide ? 'md:col-span-2 row-span-1' : 'col-span-1 row-span-1'
                  }`}
                >
                  <Link href={`/products/${product.id}`} className="absolute inset-0 z-10">
                    <span className="sr-only">View {product.name}</span>
                  </Link>
                  
                  {/* Image Background */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                  {/* Top Actions */}
                  <div className="absolute top-6 right-6 z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWishlist(product.id);
                      }}
                      className="w-10 h-10 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-colors duration-300 shadow-lg"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-medium text-xl md:text-2xl mb-1 md:mb-2 tracking-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-white/80 text-sm md:text-base">
                        {product.category}
                      </p>
                      <p className="text-white font-medium text-lg">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
