'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { itemCount: cartCount, openCart } = useCart();
  const { isLoggedIn } = useAuth();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Categories', href: '/products', icon: Search },
    { label: 'Cart', href: '#', icon: ShoppingBag, isCart: true },
    { label: 'Wishlist', href: '/wishlist', icon: Heart },
    { label: 'Account', href: isLoggedIn ? '/account' : '/login', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-border pb-safe">
      <nav className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href && !item.isCart;
          const Icon = item.icon;

          if (item.isCart) {
            return (
              <button
                key={item.label}
                onClick={openCart}
                className="flex flex-col items-center justify-center w-16 h-12 text-text-muted hover:text-foreground transition-colors relative"
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
                isActive ? 'text-foreground' : 'text-text-muted hover:text-foreground'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-foreground/10' : ''}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
