'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Check } from 'lucide-react';
import Image from 'next/image';
import { MOCK_PRODUCTS, Product } from '@/lib/mockData';
import { useCompare } from '@/contexts/CompareContext';
import { MAX_COMPARE_ITEMS } from '@/lib/compare/types';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export function AddCandidateModal({ isOpen, onClose, category }: AddCandidateModalProps) {
  const { items, addToCompare, hasInCompare, isFull } = useCompare();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products by same category and query, excluding already added items
  const candidates = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      if (p.category !== category) return false;
      if (p.category === 'Gift Cards') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [category, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-candidate-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-surface border border-border shadow-2xl rounded-2xl p-6 overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <h3 id="add-candidate-title" className="text-lg font-bold text-foreground">
                Add to Comparison
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Showing items in <span className="text-foreground font-medium">{category}</span> ({items.length}/{MAX_COMPARE_ITEMS})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-foreground rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative my-4">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${category}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-active border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {candidates.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-sm">
                No matching items found in {category}.
              </div>
            ) : (
              candidates.map((product) => {
                const alreadyAdded = hasInCompare(product.id);
                const canAddMore = !isFull;

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-surface-active/40 hover:bg-surface-active/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div className="w-12 h-12 rounded-lg bg-surface relative overflow-hidden shrink-0 border border-border/50">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-text-muted font-mono tabular-nums mt-0.5">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div>
                      {alreadyAdded ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-muted font-medium">
                          <Check className="w-3.5 h-3.5" /> Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            addToCompare(product);
                            if (items.length + 1 >= MAX_COMPARE_ITEMS) {
                              onClose();
                            }
                          }}
                          disabled={!canAddMore}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
