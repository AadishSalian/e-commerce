'use client';

import { useCompare } from '@/contexts/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export function CompareDrawer() {
  const { compareQueue, removeFromCompare, clearCompare, isCompareDrawerOpen, setIsCompareDrawerOpen } = useCompare();

  if (compareQueue.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <AnimatePresence>
        {isCompareDrawerOpen ? (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full bg-surface border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pointer-events-auto max-h-[80vh] overflow-y-auto pb-safe"
          >
            <div className="container mx-auto px-4 py-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-tight">Compare Products ({compareQueue.length}/3)</h3>
                <div className="flex gap-4">
                  <button onClick={clearCompare} className="text-sm font-medium text-text-muted hover:text-foreground">
                    Clear All
                  </button>
                  <button onClick={() => setIsCompareDrawerOpen(false)} className="p-2 bg-muted rounded-full hover:bg-surface-hover">
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {compareQueue.map(product => (
                  <div key={product.id} className="relative border border-border rounded-xl p-4 flex flex-col">
                    <button 
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-2 right-2 p-1.5 bg-background rounded-full border border-border z-10 hover:bg-surface"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="w-full aspect-square bg-muted rounded-lg mb-4 overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <h4 className="font-bold text-lg mb-1">{product.name}</h4>
                    <p className="text-text-muted text-sm mb-4">{product.category}</p>
                    <p className="text-xl font-medium mb-6">${product.price.toFixed(2)}</p>
                    
                    <div className="mt-auto space-y-3 pt-4 border-t border-border">
                      {product.attributes && Object.entries(product.attributes).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium text-right ml-2">{Array.isArray(val) ? val.join(', ') : val}</span>
                        </div>
                      ))}
                    </div>

                    <Link 
                      href={`/products/${product.id}`}
                      onClick={() => setIsCompareDrawerOpen(false)}
                      className="mt-6 w-full py-3 bg-foreground text-background text-center rounded-full font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
                    >
                      View Product
                    </Link>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: 3 - compareQueue.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px] text-text-muted bg-surface-hover/50">
                    <p className="font-medium">Add a product</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <button 
              onClick={() => setIsCompareDrawerOpen(true)}
              className="px-6 py-3 bg-foreground text-background rounded-full shadow-xl font-bold uppercase tracking-widest text-sm flex items-center gap-2 hover:scale-105 transition-transform"
            >
              Compare ({compareQueue.length}) <ChevronUp className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
