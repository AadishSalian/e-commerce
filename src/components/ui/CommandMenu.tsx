'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, ShoppingBag, User, Sun, Moon, LogOut, LogIn, ChevronRight, Settings, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isLoggedIn, logout } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle menu on CMD+K or CTRL+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when opened and lock body scroll
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSelect = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4); // Limit to 4 results

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/40 backdrop-blur-xl z-[100]"
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-surface/90 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden pointer-events-auto flex flex-col max-h-[60vh]"
            >
              <div className="flex items-center px-6 py-5 border-b border-border/50">
                <Search className="w-6 h-6 text-text-muted/70 mr-4" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, jump to pages, or switch themes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-xl font-light tracking-wide placeholder:text-text-muted/50"
                />
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-text-muted/70 tracking-widest bg-surface-active/50 px-2 py-1 rounded shadow-sm border border-border/50">
                    ESC
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-surface-active/50 text-text-muted/70 hover:text-foreground transition-colors border border-transparent hover:border-border/30"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-3 custom-scrollbar" data-lenis-prevent="true">
                {/* Search Results */}
                {query.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 text-[10px] font-bold text-text-muted/50 uppercase tracking-[0.2em] mb-2 mt-2">Products</div>
                    {filteredProducts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            onClick={() => handleSelect(() => router.push(`/products/${product.id}`))}
                            className="flex items-center gap-4 px-4 py-3 w-full text-left rounded-2xl hover:bg-surface-hover/80 transition-all duration-200 group"
                          >
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-active/50 shadow-sm border border-border/30">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-foreground font-medium text-sm">{product.name}</p>
                              <p className="text-text-muted/70 text-xs mt-0.5 tracking-wide">{product.category}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted/50 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-12 text-center flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-text-muted/30 mb-3" />
                        <p className="text-text-muted text-sm font-medium">No results found for "{query}"</p>
                        <p className="text-text-muted/50 text-xs mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                {query.length === 0 && (
                  <div className="mb-6">
                    <div className="px-4 text-[10px] font-bold text-text-muted/50 uppercase tracking-[0.2em] mb-2 mt-2">Navigation</div>
                    <div className="flex flex-col gap-1">
                      <CommandItem icon={Home} label="Home" onClick={() => handleSelect(() => router.push('/'))} />
                      <CommandItem icon={ShoppingBag} label="Products" onClick={() => handleSelect(() => router.push('/products'))} />
                      {isLoggedIn ? (
                        <>
                          <CommandItem icon={User} label="Profile" onClick={() => handleSelect(() => router.push('/profile'))} />
                          <CommandItem icon={Settings} label="Settings" onClick={() => handleSelect(() => router.push('/profile'))} />
                        </>
                      ) : (
                        <CommandItem icon={LogIn} label="Sign In" onClick={() => handleSelect(() => router.push('/login'))} />
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {query.length === 0 && (
                  <div className="mb-2">
                    <div className="px-4 text-[10px] font-bold text-text-muted/50 uppercase tracking-[0.2em] mb-2">Actions</div>
                    <div className="flex flex-col gap-1">
                      {theme === 'dark' ? (
                        <CommandItem icon={Sun} label="Switch to Light Mode" onClick={() => handleSelect(() => setTheme('light'))} />
                      ) : (
                        <CommandItem icon={Moon} label="Switch to Dark Mode" onClick={() => handleSelect(() => setTheme('dark'))} />
                      )}
                      {isLoggedIn && (
                        <CommandItem icon={LogOut} label="Log Out" onClick={() => handleSelect(() => logout())} className="text-red-500 hover:bg-red-500/10 hover:text-red-500" iconClassName="text-red-500" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommandItem({ icon: Icon, label, onClick, className = "", iconClassName = "" }: { icon: any, label: string, onClick: () => void, className?: string, iconClassName?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 w-full text-left rounded-2xl hover:bg-surface-hover/80 text-foreground transition-all duration-200 group relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />
      <div className={`p-1.5 rounded-lg bg-surface-active/50 border border-border/30 group-hover:bg-background transition-colors ${iconClassName ? 'text-transparent' : ''}`}>
        <Icon className={`w-4 h-4 text-text-muted/70 group-hover:text-foreground transition-colors ${iconClassName}`} />
      </div>
      <span className="font-medium text-sm tracking-wide">{label}</span>
      <span className="ml-auto opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-[10px] font-semibold tracking-widest uppercase text-text-muted/50 transition-all duration-300">Select</span>
    </button>
  );
}
