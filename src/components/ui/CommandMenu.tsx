'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, ShoppingBag, User, Sun, Moon, LogOut, LogIn, ChevronRight, Settings } from 'lucide-react';
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

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[60vh]"
            >
              <div className="flex items-center px-4 py-4 border-b border-border">
                <Search className="w-5 h-5 text-text-muted mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, jump to pages, or switch themes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-lg placeholder:text-text-muted"
                />
                <div className="flex items-center gap-1 text-xs text-text-muted bg-surface-active px-2 py-1 rounded">
                  <span>ESC</span>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                {/* Search Results */}
                {query.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 mt-2">Products</div>
                    {filteredProducts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            onClick={() => handleSelect(() => router.push(`/products/${product.id}`))}
                            className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-surface-hover transition-colors group"
                          >
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-surface-active" />
                            <div className="flex-1">
                              <p className="text-foreground font-medium">{product.name}</p>
                              <p className="text-text-muted text-xs capitalize">{product.category}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-8 text-center text-text-muted text-sm">
                        No products found for "{query}"
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                {query.length === 0 && (
                  <div className="mb-4">
                    <div className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 mt-2">Navigation</div>
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
                  <div>
                    <div className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 mt-2">Actions</div>
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
      className={`flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-surface-hover text-foreground transition-colors group ${className}`}
    >
      <Icon className={`w-5 h-5 text-text-muted group-hover:text-foreground transition-colors ${iconClassName}`} />
      <span className="font-medium text-sm">{label}</span>
      <span className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-text-muted transition-opacity">Select</span>
    </button>
  );
}
