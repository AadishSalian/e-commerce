'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, Menu, X, ArrowRight, Heart, Package, LogOut, Settings, UserCircle } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { NavAuthButton, ThemeToggle, ExpandableSearch, RollingText } from '@/components/ui';
import styles from './Navbar.module.css';

import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Shop', href: '/products' },
  { label: 'New Arrivals', href: '/products?category=new' },
  { label: 'Collections', href: '/products?category=collections' },
  { label: 'Craftsmanship', href: '/craftsmanship' },
  { label: 'Fit Quiz', href: '/fit-quiz' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const centerSearchRef = useRef<HTMLDivElement>(null);
  
  const { isLoggedIn, user, login, logout } = useAuth();
  const { itemCount: cartCount, openCart } = useCart();

  // Scroll animations for desktop
  const { scrollY } = useScroll();
  
  // Transform values based on scroll (0px to 100px)
  const islandGap = useTransform(scrollY, [0, 100], ['1.25rem', '0.5rem']);
  const islandPadding = useTransform(scrollY, [0, 100], ['0.25rem 0.65rem', '0.2rem 0.5rem']);
  const topMargin = useTransform(scrollY, [0, 100], ['1.25rem', '0.65rem']);

  // Mega Menu handlers with slight delay to prevent flickering
  const handleMouseEnterNav = () => {
    if (isSearchOpen) return;
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeaveNav = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 150);
  };

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close search and menus on navigation
  useEffect(() => {
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setIsAccountOpen(false);
    setIsMegaMenuOpen(false);
  }, [pathname]);

  // When search is opened, close mega menu
  useEffect(() => {
    if (isSearchOpen) {
      setIsMegaMenuOpen(false);
    }
  }, [isSearchOpen]);

  // Keyboard shortcut listener for "/" or "Cmd+K"
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (
        (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close account dropdown or search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
      if (
        isSearchOpen &&
        centerSearchRef.current &&
        !centerSearchRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-search-toggle="true"]')) {
          setIsSearchOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  return (
    <>
      {/* Desktop Split-Island Navbar */}
      {isDesktop && (
        <motion.header 
          className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none"
          style={{ marginTop: topMargin }}
        >
          <motion.div 
            className="flex items-center pointer-events-auto relative"
            style={{ gap: islandGap }}
          >
          {/* Left Island: Logo */}
          <motion.div className={styles.island} style={{ padding: islandPadding }}>
            <Link href="/" className="px-3 font-bold text-lg tracking-wider text-foreground flex items-center justify-center">
              MATTE.
            </Link>
          </motion.div>

          {/* Center Island: Navigation Links */}
          <AnimatePresence initial={false}>
            {!isSearchOpen && (
              <motion.nav 
                key="nav-links"
                className={styles.island} 
                style={{ padding: islandPadding }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.95, 
                  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } 
                }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onMouseLeave={handleMouseLeaveNav}
              >
                {NAV_LINKS.map((link) => {
                  const isActive = activeHover === link.label || (!activeHover && pathname === link.href);
                  const hasMegaMenu = !['Craftsmanship', 'About', 'Fit Quiz'].includes(link.label);
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`${styles.navLink} group`}
                      data-roll-parent=""
                      data-active={isActive}
                      onMouseEnter={() => {
                        setActiveHover(link.label);
                        if (hasMegaMenu) {
                          handleMouseEnterNav();
                        } else {
                          if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
                          setIsMegaMenuOpen(false);
                        }
                      }}
                      onMouseLeave={() => setActiveHover(null)}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activePill"
                          className={styles.activePill}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">
                        <RollingText duplicateColor={isActive ? '#141414' : 'var(--foreground)'}>
                          {link.label}
                        </RollingText>
                      </span>
                    </Link>
                  );
                })}
              </motion.nav>
            )}
          </AnimatePresence>

          {/* Right Island: Icons & Expanding Search */}
          <motion.div className={styles.island} style={{ padding: islandPadding }}>
            <div className="flex items-center mr-1 pr-2.5 border-r border-border">
              <ThemeToggle />
            </div>
            
            <ExpandableSearch 
              isOpen={isSearchOpen}
              onToggle={() => setIsSearchOpen(prev => !prev)}
              onClose={() => setIsSearchOpen(false)}
            />
            
            
            {isLoggedIn ? (
              <>
                <Link href="/account" className={styles.iconButton} aria-label="Wishlist">
                  <Heart className="w-4 h-4" />
                </Link>
                
                {/* Account Dropdown Container */}
                <div className="relative" ref={accountRef}>
                  <button 
                    className={`${styles.iconButton} overflow-hidden rounded-full p-0 w-8 h-8 flex items-center justify-center bg-surface-active border border-border`} 
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    aria-label="Account menu"
                  >
                    {user?.avatar ? (
                      <Image src={user.avatar} alt={user?.name} className="w-full h-full object-cover"  width={800} height={800} />
                    ) : user?.name ? (
                      <span className="text-xs font-semibold text-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {isAccountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`${styles.dropdownCapsule} min-w-[220px]`}
                      >
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: 0.1 }}
                          className="px-4 py-3 border-b border-border/50 mb-1"
                        >
                          <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                          <p className="text-xs text-text-muted truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                        </motion.div>
                        
                        <div className="p-1.5 flex flex-col gap-1">
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                            <Link href="/profile" className={styles.dropdownItem} onClick={() => setIsAccountOpen(false)}>
                              <UserCircle className="w-4 h-4" /> <span>Profile</span>
                            </Link>
                          </motion.div>
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <Link href="/account" className={styles.dropdownItem} onClick={() => setIsAccountOpen(false)}>
                              <Package className="w-4 h-4" /> <span>Orders</span>
                            </Link>
                          </motion.div>
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                            <Link href="/wishlist" className={styles.dropdownItem} onClick={() => setIsAccountOpen(false)}>
                              <Heart className="w-4 h-4" /> <span>Wishlist</span>
                            </Link>
                          </motion.div>
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <Link href="/settings" className={styles.dropdownItem} onClick={() => setIsAccountOpen(false)}>
                              <Settings className="w-4 h-4" /> <span>Settings</span>
                            </Link>
                          </motion.div>
                          
                          <div className="my-1 border-t border-border/50 mx-2" />
                          
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                            <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={() => { logout(); setIsAccountOpen(false); router.push('/'); }}>
                              <LogOut className="w-4 h-4" /> <span>Logout</span>
                            </button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={openCart} className={styles.iconButton} aria-label="Cart">
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
                </button>
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
                      <li><Link href="/electronics" className="group text-sm text-text-muted hover:text-accent transition-colors block" data-roll-parent=""><RollingText duplicateColor="var(--accent)">Tech</RollingText></Link></li>
                      <li><Link href="/accessories" className="group text-sm text-text-muted hover:text-accent transition-colors block" data-roll-parent=""><RollingText duplicateColor="var(--accent)">Accessories</RollingText></Link></li>
                      <li><Link href="/products?category=Objects" className="group text-sm text-text-muted hover:text-accent transition-colors block" data-roll-parent=""><RollingText duplicateColor="var(--accent)">Objects</RollingText></Link></li>
                      <li><Link href="/fashion" className="group text-sm text-text-muted hover:text-accent transition-colors block" data-roll-parent=""><RollingText duplicateColor="var(--accent)">Fashion</RollingText></Link></li>
                      <li><Link href="/home-furniture" className="group text-sm text-text-muted hover:text-accent transition-colors block" data-roll-parent=""><RollingText duplicateColor="var(--accent)">Home & Furniture</RollingText></Link></li>
                      <li><Link href="/beauty" className="group text-sm text-text-muted hover:text-accent transition-colors block" data-roll-parent=""><RollingText duplicateColor="var(--accent)">Beauty</RollingText></Link></li>
                      <li><Link href="/sports" className="group text-sm text-text-muted hover:text-accent transition-colors block" data-roll-parent=""><RollingText duplicateColor="var(--accent)">Sports & Outdoors</RollingText></Link></li>
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
                    <Link href="/products?category=new" className="flex-1 bg-surface-hover rounded-xl border border-border flex items-center justify-center p-6 relative overflow-hidden group cursor-pointer block">
                      <Image src="https://images.unsplash.com/photo-1542272201-b1ca555f8505?q=80&w=800&auto=format&fit=crop" alt="Signature Collection" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"  width={800} height={800} />
                      <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-transparent z-0" />
                      <div className="relative z-10 text-center mt-auto pb-2 w-full text-left flex flex-col justify-end h-full items-start pl-4">
                        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-1">New</p>
                        <h4 className="text-foreground font-semibold text-lg drop-shadow-md">The Signature Collection</h4>
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.header>
    )}

      {/* Ambient Spotlight Backdrop for Search */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-[3px] z-40 pointer-events-auto"
            onClick={() => setIsSearchOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Navbar (Compact Bar) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 p-2.5 bg-background/90 backdrop-blur-lg border-b border-border/50">
        <div className={styles.mobileNavContainer}>
          <Link href="/" className="font-bold text-lg tracking-wide text-foreground">
            MATTE.
          </Link>
          <div className="flex items-center gap-2">
            <div className="mr-1">
              <ThemeToggle />
            </div>
            <button 
              className={styles.iconButton}
              onClick={() => setIsMobileSearchOpen(prev => !prev)}
              aria-label="Search products"
            >
              <Search className={`w-5 h-5 transition-colors ${isMobileSearchOpen ? 'text-accent' : ''}`} />
            </button>
            <button onClick={openCart} className={styles.iconButton} aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background">
                  {cartCount}
                </span>
              )}
            </button>
            <button 
              className={styles.iconButton}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown Bar */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-visible"
            >
              <ExpandableSearch 
                isOpen={true}
                onToggle={() => setIsMobileSearchOpen(false)}
                onClose={() => setIsMobileSearchOpen(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mobile Swipeable Category Chips */}
        <div className="mt-2 -mx-4 px-4 overflow-x-auto hide-scrollbar flex items-center gap-2 pb-2">
          {['New', 'Tech', 'Objects', 'Fashion', 'Beauty'].map(cat => (
            <Link 
              key={cat} 
              href={`/products?category=${cat}`}
              className="group px-4 py-1.5 rounded-full border border-border bg-surface text-sm font-medium whitespace-nowrap text-text-muted hover:text-foreground hover:bg-surface-active transition-colors shrink-0"
              data-roll-parent=""
            >
              <RollingText duplicateColor="var(--text-primary)">{cat}</RollingText>
            </Link>
          ))}
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
                  aria-label="Close mobile menu"
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
                    className="group text-xl font-medium text-text-muted hover:text-foreground transition-colors flex items-center justify-between"
                    data-roll-parent=""
                  >
                    <RollingText duplicateColor="var(--text-primary)">{link.label}</RollingText>
                    <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
                
                <div className="w-full h-px bg-border my-4" />
                
                {isLoggedIn ? (
                  <>
                    <Link 
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group text-lg font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-3"
                      data-roll-parent=""
                    >
                      <Package className="w-5 h-5" />
                      <RollingText duplicateColor="var(--text-primary)">Orders</RollingText>
                    </Link>
                    <Link 
                      href="/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group text-lg font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-3"
                      data-roll-parent=""
                    >
                      <Heart className="w-5 h-5" />
                      <RollingText duplicateColor="var(--text-primary)">Wishlist</RollingText>
                    </Link>
                    <Link 
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group text-lg font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-3"
                      data-roll-parent=""
                    >
                      <Settings className="w-5 h-5" />
                      <RollingText duplicateColor="var(--text-primary)">Settings</RollingText>
                    </Link>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); router.push('/'); }}
                      className="group text-lg font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-3 text-left"
                      data-roll-parent=""
                    >
                      <LogOut className="w-5 h-5" />
                      <RollingText duplicateColor="var(--text-primary)">Logout</RollingText>
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
