'use client';

import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '@/contexts/WishlistContext';
import { Product } from '@/lib/mockData';

interface WishlistButtonProps {
  product: Product;
}

export function WishlistButton({ product }: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const active = isInWishlist(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (active) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background transition-all shadow-lg relative"
      title={active ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={active ? 'filled' : 'outline'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 15,
            mass: 0.5,
          }}
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-300 ${
              active ? 'text-accent fill-accent' : 'text-foreground'
            }`}
          />
        </motion.div>
      </AnimatePresence>
      {/* Micro-animation burst on add */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-accent"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}
    </button>
  );
}
