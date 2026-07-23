'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './ExpandableSearch.module.css';
import { searchProducts, SearchResult } from '@/lib/search';

export function ExpandableSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        // eslint-disable-next-line
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch (e) {
      // ignore parsing errors
    }
  }, []);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      const searchRes = searchProducts(debouncedQuery);
      // eslint-disable-next-line
      setResults(searchRes.slice(0, 5)); // Show up to 5 matches in dropdown
    } else {
      // eslint-disable-next-line
      setResults([]);
    }
    // eslint-disable-next-line
    setFocusedIndex(-1); // reset focus
  }, [debouncedQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isExpanded]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isShowingResults = debouncedQuery.trim() && results.length > 0;
    const isShowingRecent = !debouncedQuery.trim() && recentSearches.length > 0;
    
    const maxIndex = isShowingResults ? results.length : isShowingRecent ? recentSearches.length - 1 : -1;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsExpanded(false);
      triggerRef.current?.focus();
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
          // Navigate to product
          const product = results[focusedIndex].product;
          router.push(`/products/${product.id}`);
          setIsExpanded(false);
        } else if (isShowingRecent && focusedIndex < recentSearches.length) {
          // Select recent search
          const term = recentSearches[focusedIndex];
          setQuery(term);
          // Wait for debounce, or submit immediately
          handleSubmit(term);
        }
      } else {
        // Submit search query
        handleSubmit(query);
      }
    }
  };

  const handleSubmit = (termToSubmit = query) => {
    if (termToSubmit.trim()) {
      saveRecentSearch(termToSubmit.trim());
      router.push(`/search?q=${encodeURIComponent(termToSubmit.trim())}`);
      setIsExpanded(false);
    }
  };

  const handleTriggerClick = () => {
    setIsExpanded(prev => !prev);
  };

  const showDropdown = isExpanded;
  const isShowingResults = debouncedQuery.trim() !== '';
  
  return (
    <div className={styles.container} ref={containerRef}>
      <form 
        className={`${styles.searchWrapper} ${isExpanded ? styles.expanded : styles.closed}`}
        onSubmit={(e) => { 
          e.preventDefault(); 
          handleSubmit(); 
        }}
        role="search"
      >
        <button
          ref={triggerRef}
          type="button"
          className={styles.iconButton}
          onClick={handleTriggerClick}
          aria-label={isExpanded ? "Close search" : "Open search"}
          aria-expanded={isExpanded}
        >
          <Search className={styles.searchIcon} />
        </button>
        
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
          tabIndex={isExpanded ? 0 : -1}
        />
        
        <button
          type="submit"
          className={styles.submitBtn}
          aria-label="Submit search"
          tabIndex={isExpanded ? 0 : -1}
        >
          <ArrowRight className={styles.submitIcon} strokeWidth={2.5} />
        </button>
      </form>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div id="search-dropdown" className={styles.dropdown} role="listbox">
          
          {/* Results State */}
          {isShowingResults && (
            <>
              {results.length > 0 ? (
                <>
                  <div className={styles.dropdownHeader}>Products</div>
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
                            router.push(`/products/${res.product.id}`);
                            setIsExpanded(false);
                          }}
                          onMouseEnter={() => setFocusedIndex(idx)}
                        >
                          {res.product.image && (
                            <img 
                              src={res.product.image} 
                              alt=""
                              className={styles.thumbnail}
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
                  {results.length >= 5 && searchProducts(debouncedQuery).length > 5 && (
                    <button 
                      type="button"
                      className={styles.seeAllBtn}
                      onClick={() => handleSubmit(debouncedQuery)}
                    >
                      See all results for &quot;{debouncedQuery}&quot;
                    </button>
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p>No products found for &quot;{debouncedQuery}&quot;</p>
                  <p className="text-xs mt-2 opacity-70">Try a different search term or category.</p>
                </div>
              )}
            </>
          )}

          {/* Recent Searches State */}
          {!isShowingResults && recentSearches.length > 0 && (
            <>
              <div className={styles.dropdownHeader}>Recent Searches</div>
              <ul className={styles.dropdownList}>
                {recentSearches.map((term, idx) => (
                  <li key={term}>
                    <button
                      id={`search-item-${idx}`}
                      type="button"
                      className={styles.recentSearchItem}
                      role="option"
                      aria-selected={focusedIndex === idx}
                      onClick={() => {
                        setQuery(term);
                        handleSubmit(term);
                      }}
                      onMouseEnter={() => setFocusedIndex(idx)}
                    >
                      <Clock className={styles.recentSearchIcon} />
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

        </div>
      )}
    </div>
  );
}
