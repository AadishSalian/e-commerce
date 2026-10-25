'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  ShoppingBag,
  Share2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  Check
} from 'lucide-react';
import { Product } from '@/lib/mockData';
import { useCompare } from '@/contexts/CompareContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { buildComparisonTableData } from '@/lib/compare/tableData';
import { MAX_COMPARE_ITEMS } from '@/lib/compare/types';
import { AddCandidateModal } from './AddCandidateModal';

interface ComparisonViewProps {
  products: Product[];
}

export function ComparisonView({ products }: ComparisonViewProps) {
  const { removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const tableData = useMemo(() => buildComparisonTableData(products), [products]);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    toast(`Added "${product.name}" to your bag`);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const ids = products.map((p) => p.id).join(',');
    const url = `${window.location.origin}/compare?ids=${ids}`;
    navigator.clipboard.writeText(url);
    toast('Comparison link copied to clipboard');
  };

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg">
        <div className="w-16 h-16 rounded-2xl bg-surface-active border border-border mx-auto flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
          No items to compare
        </h1>
        <p className="text-sm text-text-muted mb-8 leading-relaxed">
          Add up to 4 items from any category while browsing to view their detailed specifications side by side.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Catalog
        </Link>
      </div>
    );
  }

  const category = tableData.category;
  const canAddMore = products.length < MAX_COMPARE_ITEMS;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
      {/* Top Bar: Title, Category, Differing toggle & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1.5">
            <Link href="/products" className="hover:text-foreground transition-colors">
              Products
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{category}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
            Compare {category}
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            Comparing {products.length} of {MAX_COMPARE_ITEMS} items •{' '}
            <span className="font-mono">{tableData.differingAttributesCount} differing specs</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Differences-only Toggle */}
          <button
            type="button"
            onClick={() => setOnlyDifferences(!onlyDifferences)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
              onlyDifferences
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-surface border-border text-text-muted hover:text-foreground hover:border-foreground/30'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                onlyDifferences ? 'bg-accent border-accent text-background' : 'border-border'
              }`}
            >
              {onlyDifferences && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>Show differences only</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
            title="Copy shareable link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Clear All */}
          <button
            type="button"
            onClick={clearCompare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-text-muted hover:text-rose-500 hover:border-rose-500/30 transition-colors"
            title="Clear all compared items"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear all</span>
          </button>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="relative border border-border rounded-2xl bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-left min-w-[700px] md:min-w-[900px]">
            {/* Sticky Product Header */}
            <thead>
              <tr className="border-b border-border bg-surface-active/70 backdrop-blur-md sticky top-0 z-30">
                {/* Top-Left Header Cell */}
                <th className="sticky left-0 z-40 bg-surface-active/95 backdrop-blur-md p-4 md:p-6 w-48 md:w-64 border-r border-border align-bottom">
                  <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Attribute
                  </div>
                </th>

                {/* Product Column Headers */}
                {products.map((product) => (
                  <th key={product.id} className="p-4 md:p-6 min-w-[200px] md:w-72 align-top relative">
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors"
                      aria-label={`Remove ${product.name} from comparison`}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Image */}
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-surface overflow-hidden relative mb-3 border border-border/60">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 96px, 112px"
                      />
                    </div>

                    {/* Title & Price */}
                    <h3 className="text-sm md:text-base font-bold text-foreground leading-snug line-clamp-2 mb-1">
                      <Link href={`/products/${product.id}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </h3>
                    <p className="text-sm md:text-base font-mono font-semibold text-foreground mb-4">
                      ${product.price.toFixed(2)}
                    </p>

                    {/* Buy CTA */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors shadow-sm"
                    >
                      {addedIds[product.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added to Bag
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag
                        </>
                      )}
                    </button>
                  </th>
                ))}

                {/* Empty column / Add candidate placeholder */}
                {canAddMore && (
                  <th className="p-4 md:p-6 min-w-[180px] w-64 align-middle text-center border-l border-dashed border-border/60">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-full h-48 rounded-xl border border-dashed border-border/80 hover:border-foreground/50 hover:bg-surface-active/50 transition-all flex flex-col items-center justify-center gap-2 text-text-muted hover:text-foreground group"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium">Add product</span>
                      <span className="text-[10px] text-text-muted/60">({products.length}/{MAX_COMPARE_ITEMS})</span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body: Sections and Rows */}
            <tbody>
              {tableData.sections.map((section) => {
                const isCollapsed = Boolean(collapsedSections[section.id]);
                const visibleRows = onlyDifferences
                  ? section.rows.filter((r) => r.isDiffering)
                  : section.rows;

                if (visibleRows.length === 0 && onlyDifferences) {
                  return null;
                }

                return (
                  <React.Fragment key={section.id}>
                    {/* Section Header Row */}
                    <tr className="bg-surface-active/40 border-t border-b border-border/80">
                      <td
                        colSpan={products.length + (canAddMore ? 2 : 1)}
                        className="py-2.5 px-4 md:px-6 cursor-pointer hover:bg-surface-active/60 transition-colors select-none"
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                            {section.title}
                          </span>
                          <span className="text-text-muted">
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Section Attribute Rows */}
                    {!isCollapsed &&
                      visibleRows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-border/50 hover:bg-surface-active/30 transition-colors group/row"
                        >
                          {/* Attribute Label */}
                          <td className="sticky left-0 z-20 bg-surface group-hover/row:bg-surface-active/60 p-4 md:p-5 border-r border-border text-xs md:text-sm font-medium text-foreground">
                            <div className="flex items-center gap-1.5">
                              <span>{row.label}</span>
                              {row.isDiffering && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-accent"
                                  title="Values differ across items"
                                />
                              )}
                            </div>
                          </td>

                          {/* Product Values */}
                          {products.map((product) => {
                            const val = row.values[product.id];
                            const isBest = row.bestProductId === product.id;

                            return (
                              <td
                                key={`${row.key}-${product.id}`}
                                className="p-4 md:p-5 text-xs md:text-sm text-foreground align-top"
                              >
                                {val !== null && val !== undefined ? (
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="leading-relaxed">{val}</span>
                                    {isBest && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-medium">
                                        <Sparkles className="w-2.5 h-2.5" /> Best value
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span
                                    className="text-text-muted/50 cursor-help"
                                    title="Not specified"
                                  >
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Empty column padding cell */}
                          {canAddMore && <td className="p-4 md:p-5 text-center text-text-muted/30">—</td>}
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        category={category}
      />
    </div>
  );
}
