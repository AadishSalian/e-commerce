'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './ExpandableSearch.module.css';

export function ExpandableSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Close when clicking outside if empty
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        if (query.trim() === '') {
          setIsExpanded(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      // Small timeout to allow width transition to start so focus outline doesn't jump
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isExpanded]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsExpanded(false);
      triggerRef.current?.focus();
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  const handleTriggerClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <div className={styles.container}>
      <form 
        className={`${styles.searchWrapper} ${isExpanded ? styles.expanded : styles.closed}`}
        onSubmit={(e) => { 
          e.preventDefault(); 
          handleSubmit(); 
        }}
        ref={containerRef}
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
    </div>
  );
}
