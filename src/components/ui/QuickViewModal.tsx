'use client';
import { useState } from 'react';
import { useQuickView } from '@/contexts/QuickViewContext';
import { useCart } from '@/contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { PrimaryButton } from './PrimaryButton';

export function QuickViewModal() {
  const { activeProduct, isOpen, closeQuickView } = useQuickView();
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  if (!activeProduct) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" data-lenis-prevent="true">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQuickView}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={closeQuickView}
              className="absolute top-4 right-4 z-10 p-2 bg-background/50 backdrop-blur-md rounded-full hover:bg-background transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            {/* Image */}
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-muted relative">
              <img 
                src={activeProduct.image} 
                alt={activeProduct.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto hide-scrollbar">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                {activeProduct.name}
              </h2>
              <p className="text-2xl font-medium text-foreground mb-6">
                ${activeProduct.price.toFixed(2)}
              </p>
              
              <p className="text-text-muted leading-relaxed mb-8">
                {activeProduct.description}
              </p>

              {activeProduct.variants && activeProduct.variants.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-foreground mb-4">Options</h4>
                  <div className="flex flex-wrap gap-3">
                    {activeProduct.variants.map(v => (
                      <span key={v.id} className="px-4 py-2 border border-border rounded-full text-sm text-foreground">
                        {v.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-8 flex gap-4">
                <PrimaryButton 
                  onClick={() => {
                    addToCart({
                      id: activeProduct.id,
                      name: activeProduct.name,
                      price: activeProduct.price,
                      image: activeProduct.image,
                      quantity: 1
                    } as any, 1);
                    setIsAdded(true);
                    setTimeout(() => {
                      setIsAdded(false);
                      closeQuickView();
                    }, 1000);
                  }}
                  isSuccess={isAdded}
                  className="flex-1 py-4 font-bold uppercase tracking-widest text-sm"
                  icon={<ShoppingBag className="w-4 h-4" />}
                >
                  Add to Bag
                </PrimaryButton>
                <Link 
                  href={`/products/${activeProduct.id}`}
                  onClick={closeQuickView}
                  className="px-6 py-4 border border-border rounded-full font-bold uppercase tracking-widest text-sm text-foreground hover:bg-surface-hover transition-colors"
                >
                  Full Details
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
