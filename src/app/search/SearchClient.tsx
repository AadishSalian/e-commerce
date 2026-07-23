'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/lib/mockData';
import { searchProducts, SearchResult } from '@/lib/search';
import { ChevronDown, Filter } from 'lucide-react';

export default function SearchClient() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') || searchParams.get('search') || '';
  const query = decodeURIComponent(rawQuery);
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Update search results when query changes
  useEffect(() => {
    if (query) {
      setSearchResults(searchProducts(query));
    } else {
      setSearchResults([]);
    }
    // Reset filters on new search
    setActiveCategory('All');
    setSortBy('relevance');
  }, [query]);

  // Apply filters and sorting
  const processedResults = searchResults
    .filter(res => activeCategory === 'All' ? true : res.product.category === activeCategory)
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.product.price - b.product.price;
      if (sortBy === 'price-high') return b.product.price - a.product.price;
      if (sortBy === 'newest') return a.product.isNew ? -1 : (b.product.isNew ? 1 : 0);
      return b.score - a.score; // default 'relevance'
    });

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Search Results
          </h1>
          <p className="text-text-muted text-lg max-w-2xl" aria-live="polite">
            {query ? (
              `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for "${query}"`
            ) : (
              'Enter a search term to find products.'
            )}
          </p>
        </div>

        {/* Filters & Sorting Toolbar */}
        {searchResults.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-y border-border py-4">
            {/* Category Pill Filters */}
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
              <span className="text-sm font-medium text-text-muted mr-2 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filter
              </span>
              {CATEGORIES.map(category => {
                // Only show categories that have results, plus "All"
                const count = category === 'All' 
                  ? searchResults.length 
                  : searchResults.filter(r => r.product.category === category).length;
                
                if (count === 0) return null;

                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shrink-0 flex items-center gap-2 ${
                      activeCategory === category 
                        ? 'bg-accent text-foreground scale-95'
                        : 'bg-surface text-text-muted hover:bg-surface-hover'
                    }`}
                  >
                    {category} <span className="opacity-60 text-xs">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-medium text-text-muted">Sort by</span>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-surface border border-border text-foreground text-sm font-medium px-4 py-2 pr-10 rounded-full focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <ChevronDown className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {processedResults.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
          >
            <AnimatePresence>
              {processedResults.map(({ product }, idx) => (
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
                      <div className="flex-1 w-full bg-surface-hover rounded-lg flex items-center justify-center relative overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:opacity-0 transition-opacity duration-500"
                          />
                        ) : null}
                        {product.hoverImage ? (
                          <img 
                            src={product.hoverImage} 
                            alt={`${product.name} Alternate`}
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          />
                        ) : null}
                        {!product.image && (
                          <span className="text-xs text-text-muted uppercase tracking-widest">{product.name}</span>
                        )}
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
        ) : (
          /* Empty State */
          <div className="py-24 text-center max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">No matches found</h2>
            <p className="text-text-muted text-lg mb-8">
              We couldn&apos;t find anything matching &quot;{query}&quot;. Try checking your spelling or using more general terms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="px-6 py-3 bg-accent text-background font-medium rounded-full hover:bg-accent-hover transition-colors">
                Browse All Products
              </Link>
              <Link href="/products?category=new" className="px-6 py-3 bg-surface text-foreground font-medium rounded-full hover:bg-surface-hover transition-colors border border-border">
                Shop New Arrivals
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
