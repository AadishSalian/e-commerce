'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search, ArrowRight, Clock, Mic, Scan, X, TrendingUp, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ExpandableSearch.module.css';
import { searchProducts, SearchResult } from '@/lib/search';
import { Loader } from '@/components/ui/Loader';
import Image from 'next/image';

const POPULAR_SEARCHES = ['Keyboard', 'Ceramics', 'Desk', 'Minimalist', 'Audio', 'Leather'];
const CATEGORIES = ['All', 'Tech', 'Objects', 'Fashion', 'Beauty'];

export interface ExpandableSearchProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function ExpandableSearch({
  isOpen,
  onToggle,
  onClose,
}: ExpandableSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        let searchRes = searchProducts(debouncedQuery);
        if (selectedCategory !== 'All') {
          searchRes = searchRes.filter(r => 
            r.product.category?.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        setResults(searchRes.slice(0, 5));
        setIsSearching(false);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsSearching(false);
    }
    setFocusedIndex(-1);
  }, [debouncedQuery, selectedCategory]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('recentSearches');
    } catch {
      // ignore
    }
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== termToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSubmit = (termToSubmit = query) => {
    if (termToSubmit.trim()) {
      saveRecentSearch(termToSubmit.trim());
      const catParam = selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      router.push(`/search?q=${encodeURIComponent(termToSubmit.trim())}${catParam}`);
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isShowingResults = debouncedQuery.trim() !== '' && results.length > 0;
    const isShowingRecent = !debouncedQuery.trim() && recentSearches.length > 0;
    const maxIndex = isShowingResults ? results.length : isShowingRecent ? recentSearches.length - 1 : -1;

    if (e.key === 'Escape') {
      e.preventDefault();
      if (query) {
        setQuery('');
        setDebouncedQuery('');
      } else {
        onClose();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < maxIndex ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0) {
        if (isShowingResults && focusedIndex < results.length) {
          const product = results[focusedIndex].product;
          saveRecentSearch(product.name);
          router.push(`/products/${product.id}`);
          onClose();
        } else if (isShowingRecent && focusedIndex < recentSearches.length) {
          const term = recentSearches[focusedIndex];
          setQuery(term);
          handleSubmit(term);
        }
      } else {
        handleSubmit(query);
      }
    }
  };

  const handleClearQuery = () => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const isShowingResults = debouncedQuery.trim() !== '';

  return (
    <div className={styles.container} ref={containerRef}>
      {!isOpen ? (
        /* Closed State: Sleek Round Trigger Button that expands from this exact location */
        <button
          type="button"
          className={styles.closedTrigger}
          onClick={onToggle}
          aria-label="Open search"
          aria-expanded={false}
          title="Search products (Press / or Cmd+K)"
        >
          <Search className={styles.closedSearchIcon} />
        </button>
      ) : (
        /* Expanded State: Smoothly expands directly from the trigger button */
        <motion.div
          className={styles.expandedWrapper}
          initial={{ width: 34, opacity: 0 }}
          animate={{ width: 310, opacity: 1 }}
          exit={{ width: 34, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
        >
          <form 
            className={styles.searchForm}
            onSubmit={(e) => { 
              e.preventDefault(); 
              handleSubmit(); 
            }}
            role="search"
          >
            <div className={styles.searchIconWrap}>
              <Search className={styles.searchIcon} />
            </div>
            
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search query"
              aria-autocomplete="list"
              aria-controls="search-dropdown"
              aria-activedescendant={focusedIndex >= 0 ? `search-item-${focusedIndex}` : undefined}
            />
            
            {/* Actions on the right of input */}
            <div className={styles.actionsRight}>
              {query ? (
                <div className={styles.inputActions}>
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={handleClearQuery}
                    aria-label="Clear search query"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    aria-label="Submit search"
                  >
                    <ArrowRight className={styles.submitIcon} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className={styles.extraActions}>
                  <button type="button" className={styles.actionIcon} aria-label="Voice search" title="Voice Search">
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className={styles.actionIcon} aria-label="Barcode search" title="Scan Barcode">
                    <Scan className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Close Button right inside the expanded search pill */}
              <button
                type="button"
                className={styles.closeSearchBtn}
                onClick={onClose}
                aria-label="Close search"
                title="Close search (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Floating Dropdown Panel */}
          <AnimatePresence>
            <motion.div 
              id="search-dropdown" 
              className={styles.dropdown} 
              role="listbox"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Category Filter Pills */}
              <div className={styles.categoryBar}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.catPill} ${selectedCategory === cat ? styles.catPillActive : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Results State */}
              {isShowingResults ? (
                <>
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader size="sm" fullScreen={false} showCaption={false} />
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      <div className={styles.dropdownHeaderRow}>
                        <span className={styles.dropdownHeader}>Products</span>
                        <span className={styles.resultsBadge}>{results.length} found</span>
                      </div>
                      <ul className={styles.dropdownList}>
                        {results.map((res, idx) => (
                          <li key={res.product.id}>
                            <a 
                              id={`search-item-${idx}`}
                              href={`/products/${res.product.id}`}
                              className={styles.suggestionItem}
                              role="option"
                              aria-selected={focusedIndex === idx}
                              onClick={(e) => {
                                e.preventDefault();
                                saveRecentSearch(res.product.name);
                                router.push(`/products/${res.product.id}`);
                                onClose();
                              }}
                              onMouseEnter={() => setFocusedIndex(idx)}
                            >
                              {res.product.image && (
                                <Image 
                                  src={res.product.image} 
                                  alt=""
                                  className={styles.thumbnail}
                                  width={88}
                                  height={88}
                                />
                              )}
                              <div className={styles.productInfo}>
                                <span className={styles.productName}>{res.product.name}</span>
                                <span className={styles.productCategory}>{res.product.category}</span>
                              </div>
                              <span className={styles.productPrice}>${res.product.price.toFixed(2)}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      {searchProducts(debouncedQuery).length > 5 && (
                        <button 
                          type="button"
                          className={styles.seeAllBtn}
                          onClick={() => handleSubmit(debouncedQuery)}
                        >
                          <span>See all results for &quot;{debouncedQuery}&quot;</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5 inline" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className={styles.emptyState}>
                      <p className="font-medium text-foreground">No products found</p>
                      <p className="text-xs mt-1 text-text-muted">
                        No matches for &quot;{debouncedQuery}&quot;. Try selecting another category or keyword.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Initial State: Recent Searches & Trending Suggestions */
                <div className={styles.initialContent}>
                  {recentSearches.length > 0 && (
                    <div className={styles.section}>
                      <div className={styles.dropdownHeaderRow}>
                        <span className={styles.dropdownHeader}>Recent Searches</span>
                        <button
                          type="button"
                          className={styles.clearAllBtn}
                          onClick={handleClearAllRecent}
                        >
                          Clear all
                        </button>
                      </div>
                      <div className={styles.chipList}>
                        {recentSearches.map((term, idx) => (
                          <div
                            key={term}
                            id={`search-item-${idx}`}
                            className={`${styles.chip} ${focusedIndex === idx ? styles.chipActive : ''}`}
                            role="option"
                            aria-selected={focusedIndex === idx}
                            onClick={() => {
                              setQuery(term);
                              handleSubmit(term);
                            }}
                            onMouseEnter={() => setFocusedIndex(idx)}
                          >
                            <Clock className={styles.chipIcon} />
                            <span className={styles.chipText}>{term}</span>
                            <button
                              type="button"
                              className={styles.chipRemoveBtn}
                              aria-label={`Remove ${term}`}
                              title="Remove"
                              onClick={(e) => handleRemoveRecentSearch(e, term)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Suggestions */}
                  <div className={styles.section}>
                    <div className={styles.dropdownHeaderRow}>
                      <span className={styles.dropdownHeader}>Trending Suggestions</span>
                    </div>
                    <div className={styles.chipList}>
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          className={styles.suggestionChip}
                          onClick={() => {
                            setQuery(term);
                            handleSubmit(term);
                          }}
                        >
                          <TrendingUp className={styles.trendingIcon} />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
