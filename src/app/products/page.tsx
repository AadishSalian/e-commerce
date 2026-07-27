'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PRODUCTS, CATEGORIES } from '@/lib/mockData';
import { ChevronDown, Filter, Eye, Layers } from 'lucide-react';
import { useQuickView } from '@/contexts/QuickViewContext';
import { useCompare } from '@/contexts/CompareContext';

export default function ProductsPage() {
  const { openQuickView } = useQuickView();
  const { addToCompare } = useCompare();
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  return (
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

        {/* Filters & Sorting Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-y border-border py-4">
          
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
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface border border-border text-foreground text-sm font-medium px-4 py-3 pr-10 rounded-full focus:outline-none focus:border-[#8ed500] focus:ring-1 focus:ring-[#8ed500] transition-all"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      {/* End of Filters & Sorting Toolbar */}

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
                  <div className="w-full aspect-[4/5] bg-surface rounded-xl border border-transparent group-hover:border-border transition-colors duration-300 mb-6 flex flex-col p-2 relative overflow-hidden">
                    {product.isNew && (
                      <span className="absolute top-6 left-6 z-10 text-[10px] font-bold uppercase tracking-widest bg-[#8ed500] text-[#121212] px-2.5 py-1 rounded-sm shadow-sm">
                        New
                      </span>
                    )}
                    <div className="flex-1 w-full bg-surface-hover rounded-lg flex items-center justify-center relative overflow-hidden">
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
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-foreground font-medium text-lg mb-1">{product.name}</h3>
                      <p className="text-text-muted text-sm">{product.variants && product.variants.length > 0 ? `${product.variants.length} Colors` : '1 Color'}</p>
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
