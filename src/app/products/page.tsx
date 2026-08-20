'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PRODUCTS, CATEGORIES } from '@/lib/mockData';
import { ChevronDown, Filter, Eye, Layers } from 'lucide-react';
import { useQuickView } from '@/contexts/QuickViewContext';
import { useCompare } from '@/contexts/CompareContext';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { WishlistButton, PullToRefresh, BottomSheet } from '@/components/ui';
import ProductCard from '@/components/product/ProductCard';

export default function ProductsPage() {
  const { openQuickView } = useQuickView();
  const { addToCompare } = useCompare();
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0; // default 'newest'
  });

  const handleRefresh = async () => {
    // simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // just dummy refresh
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background pt-24 pb-32">
        <div className="container mx-auto px-4 md:px-8">
          
          {/* Header Section */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              The Collection.
            </h1>
            <p className="text-text-muted text-lg max-w-2xl">
              Precision-engineered objects for your daily workflow. Designed to integrate seamlessly, built to last.
            </p>
          </div>

          {/* Desktop Filters & Sorting Toolbar */}
          <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-y border-border py-4">
            
            {/* Category Pill Filters */}
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar flex-1 w-full md:w-auto">
              <span className="text-sm font-medium text-text-muted mr-2 flex items-center gap-2 shrink-0">
                <Filter className="w-4 h-4" /> Filter
              </span>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shrink-0 border ${
                    activeCategory === category 
                      ? 'bg-[#8ed500] text-[#121212] border-[#8ed500] shadow-sm scale-95' 
                      : 'bg-surface border-transparent text-text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto mt-4 md:mt-0">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-border text-foreground text-sm px-4 py-3 rounded-full focus:outline-none focus:border-[#8ed500] focus:ring-1 focus:ring-[#8ed500] transition-all"
                />
              </div>

              {/* Sort Dropdown (Simplified for UI mockup) */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium text-text-muted hidden sm:inline">Sort by</span>
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                variant="pill"
                options={[
                  { label: 'Newest', value: 'newest' },
                  { label: 'Price: Low to High', value: 'price-low' },
                  { label: 'Price: High to Low', value: 'price-high' }
                ]}
              />
            </div>
          </div>
        </div>
        {/* End of Filters & Sorting Toolbar */}

        {/* Mobile Filter Button */}
        <div className="md:hidden flex justify-between items-center mb-8 gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border text-foreground text-sm px-4 py-3 rounded-full focus:outline-none focus:border-[#8ed500]"
            />
          </div>
          <button 
            onClick={() => setIsFilterDrawerOpen(true)}
            className="flex items-center gap-2 bg-surface border border-border px-4 py-3 rounded-full text-sm font-medium"
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        <BottomSheet 
          isOpen={isFilterDrawerOpen} 
          onClose={() => setIsFilterDrawerOpen(false)} 
          title="Filters & Sorting"
        >
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-foreground font-semibold mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeCategory === category 
                        ? 'bg-[#8ed500] text-[#121212] border-[#8ed500]' 
                        : 'bg-surface border border-border text-text-muted hover:text-foreground'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-foreground font-semibold mb-4">Sort By</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Newest', value: 'newest' },
                  { label: 'Price: Low to High', value: 'price-low' },
                  { label: 'Price: High to Low', value: 'price-high' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      sortBy === option.value 
                        ? 'bg-surface-active text-foreground border border-border' 
                        : 'bg-transparent text-text-muted hover:bg-surface border border-transparent'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setIsFilterDrawerOpen(false)}
              className="w-full bg-foreground text-background py-4 rounded-xl font-bold mt-4"
            >
              Show Results
            </button>
          </div>
        </BottomSheet>

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
                  <ProductCard product={product} variant="default" />
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
    </PullToRefresh>
  );
}
