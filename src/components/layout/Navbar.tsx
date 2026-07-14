'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, Menu, X, ArrowRight, Heart, Package, LogOut } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { NavAuthButton, ThemeToggle, ExpandableSearch } from '@/components/ui';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Shop', href: '/products' },
  { label: 'New Arrivals', href: '/products?category=new' },
  { label: 'Collections', href: '/products?category=collections' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(2);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  
  const { isLoggedIn, login, logout } = useAuth();

  // Scroll animations for desktop
  const { scrollY } = useScroll();
  
  // Transform values based on scroll (0px to 100px)
  const islandGap = useTransform(scrollY, [0, 100], ['1.5rem', '0.5rem']);
  const islandPadding = useTransform(scrollY, [0, 100], ['0.5rem 0.75rem', '0.25rem 0.5rem']);
  const topMargin = useTransform(scrollY, [0, 100], ['1.5rem', '0.75rem']);

  // Mega Menu handlers with slight delay to prevent flickering
  const handleMouseEnterNav = () => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeaveNav = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 150);
  };

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop Split-Island Navbar */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 hidden md:flex flex-col items-center pointer-events-none"
        style={{ marginTop: topMargin }}
      >
        <motion.div 
          className="flex items-center pointer-events-auto relative"
          style={{ gap: islandGap }}
        >
          {/* Left Island: Logo */}
          <motion.div className={styles.island} style={{ padding: islandPadding }}>
            <Link href="/" className="px-4 font-bold text-xl tracking-wide text-foreground flex items-center justify-center">
              MATTE.
            </Link>
          </motion.div>

          {/* Center Island: Links */}
          <motion.nav 
            className={styles.island} 
            style={{ padding: islandPadding }}
            onMouseEnter={handleMouseEnterNav}
            onMouseLeave={handleMouseLeaveNav}
          >
            {NAV_LINKS.map((link) => {
              const isActive = activeHover === link.label || (!activeHover && pathname === link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={styles.navLink}
                  data-active={isActive}
                  onMouseEnter={() => setActiveHover(link.label)}
                  onMouseLeave={() => setActiveHover(null)}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className={styles.activePill}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </motion.nav>

          {/* Right Island: Icons */}
          <motion.div className={styles.island} style={{ padding: islandPadding }}>
            <div className="flex items-center mr-1 pr-3 border-r border-border">
              <ThemeToggle />
            </div>
            
            
            <ExpandableSearch />
            
            
            {isLoggedIn ? (
              <>
                <Link href="/account" className={styles.iconButton} aria-label="Wishlist">
                  <Heart className="w-4 h-4" />
                </Link>
                
                {/* Account Dropdown Container */}
                <div className="relative" ref={accountRef}>
                  <button 
                    className={styles.iconButton} 
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    aria-label="Account menu"
                  >
                    <User className="w-4 h-4" />
                  </button>
                  
                  <AnimatePresence>
                    {isAccountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={styles.dropdownCapsule}
                      >
                        <Link href="/account" className={styles.dropdownItem} onClick={() => setIsAccountOpen(false)}>
                          <Package className="w-4 h-4" /> Orders
                        </Link>
                        <button className={styles.dropdownItem} onClick={() => { logout(); setIsAccountOpen(false); }}>
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link href="/cart" className={styles.iconButton} aria-label="Cart">
                  <ShoppingBag className="w-4 h-4" />
                  <AnimatePresence mode="popLayout">
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </>
            ) : (
              <div className="ml-2 pl-2 border-l border-border flex items-center">
                <NavAuthButton onClick={() => router.push('/login')} label="Sign In" />
              </div>
            )}
          </motion.div>

          {/* Mega Menu Panel */}
          <AnimatePresence>
            {isMegaMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={styles.megaMenu}
                onMouseEnter={handleMouseEnterNav}
                onMouseLeave={handleMouseLeaveNav}
              >
                <div className="grid grid-cols-4 gap-8">
                  <div className="col-span-1">
                    <h3 className="text-foreground font-semibold mb-4">Categories</h3>
                    <ul className="flex flex-col gap-3">
                      <li><Link href="/products?category=tech" className="text-sm text-text-muted hover:text-accent transition-colors">Tech Essentials</Link></li>
                      <li><Link href="/products?category=home" className="text-sm text-text-muted hover:text-accent transition-colors">Home & Office</Link></li>
                      <li><Link href="/products?category=carry" className="text-sm text-text-muted hover:text-accent transition-colors">Everyday Carry</Link></li>
                      <li><Link href="/products?category=audio" className="text-sm text-text-muted hover:text-accent transition-colors">Audio Equipment</Link></li>
                    </ul>
                  </div>
                  <div className="col-span-1">
                    <h3 className="text-foreground font-semibold mb-4">Featured</h3>
                    <ul className="flex flex-col gap-3">
                      <li><Link href="/products/p-1" className="text-sm text-text-muted hover:text-accent transition-colors">Matte Keyboard 1</Link></li>
                      <li><Link href="/products/p-2" className="text-sm text-text-muted hover:text-accent transition-colors">Ceramic Earbuds</Link></li>
                      <li><Link href="/products/p-3" className="text-sm text-text-muted hover:text-accent transition-colors">Aluminum Stand</Link></li>
                    </ul>
                  </div>
                  <div className="col-span-2 flex gap-4">
                    <div className="flex-1 bg-surface-hover rounded-xl border border-border flex items-center justify-center p-6 relative overflow-hidden group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-tr from-background to-transparent opacity-50 z-0" />
                      <div className="relative z-10 text-center">
                        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-1">New</p>
                        <h4 className="text-foreground font-semibold text-lg">The Signature Collection</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.header>

      {/* Mobile Navbar (Compact Bar) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 p-4">
        <div className={styles.mobileNavContainer}>
          <Link href="/" className="font-bold text-lg tracking-wide text-foreground">
            MATTE.
          </Link>
          <div className="flex items-center gap-2">
            <div className="mr-1">
              <ThemeToggle />
            </div>
            {isLoggedIn ? (
              <Link href="/cart" className={styles.iconButton} aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background">
                    {cartCount}
                  </span>
                )}
              </Link>
            ) : (
              <ExpandableSearch />
            )}
            <button 
              className={styles.iconButton}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.mobileOverlay}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={styles.mobileDrawer}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-xl tracking-wide text-foreground">Menu</span>
                <button 
                  className={styles.iconButton}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-6 flex-1 overflow-y-auto">
                {NAV_LINKS.map(link => (
                  <Link 
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xl font-medium text-text-muted hover:text-foreground transition-colors flex items-center justify-between"
                  >
                    {link.label}
                    <ArrowRight className="w-5 h-5 opacity-50" />
                  </Link>
                ))}
                
                <div className="w-full h-px bg-border my-4" />
                
                {isLoggedIn ? (
                  <>
                    <Link 
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-3"
                    >
                      <Package className="w-5 h-5" /> Orders
                    </Link>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="text-lg font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-3 text-left"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="pt-2 flex justify-start">
                    <NavAuthButton onClick={() => { router.push('/login'); setIsMobileMenuOpen(false); }} label="Sign In to Shop" />
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
