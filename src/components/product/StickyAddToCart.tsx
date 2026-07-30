'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/lib/mockData';
import { PrimaryButton } from '../ui';

interface Props {
  product: Product;
  selectedVariant?: string;
  onAddToCart: () => void;
  showAfterY?: number;
}

export default function StickyAddToCart({ product, selectedVariant, onAddToCart, showAfterY = 600 }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterY]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-surface/90 backdrop-blur-xl border-b border-border shadow-sm py-3 px-4 md:px-8 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-surface-active rounded-md overflow-hidden shrink-0 border border-border hidden sm:block">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-foreground text-sm sm:text-base truncate">{product.name}</h3>
              <p className="text-xs text-text-muted truncate">
                ${product.price.toFixed(2)} {selectedVariant ? `• ${selectedVariant}` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <span className="font-bold text-foreground hidden sm:block">${product.price.toFixed(2)}</span>
            <PrimaryButton 
              onClick={onAddToCart}
              className="px-6 py-2 text-sm whitespace-nowrap shadow-lg shadow-accent/20"
            >
              Add to Bag
            </PrimaryButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
