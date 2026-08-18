'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Product } from '@/lib/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Map categories to an image for the hover preview
const CATEGORY_IMAGES: Record<string, string> = {
  'Tech': 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=300&auto=format&fit=crop',
  'Fashion': 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=300&auto=format&fit=crop',
  'Home & Furniture': 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=300&auto=format&fit=crop',
  'Beauty': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop',
  'Sports & Outdoors': 'https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?q=80&w=300&auto=format&fit=crop',
  'Accessories': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=300&auto=format&fit=crop'
};

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export function Breadcrumbs({ product }: { product: Product }) {
  const [isHoveringCategory, setIsHoveringCategory] = useState(false);
  const categoryImage = CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES['Tech'];
  const categoryLink = `/${slugify(product.category)}`;

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 flex items-center text-sm text-text-muted z-30 relative">
      <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
      <ChevronRight className="w-4 h-4 mx-2" />
      
      <div 
        className="relative group"
        onMouseEnter={() => setIsHoveringCategory(true)}
        onMouseLeave={() => setIsHoveringCategory(false)}
      >
        <Link href={categoryLink} className="hover:text-foreground transition-colors">
          {product.category}
        </Link>

        {/* Hover Dropdown Preview */}
        <AnimatePresence>
          {isHoveringCategory && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 pointer-events-none"
            >
              <div className="h-32 w-full relative">
                <img 
                  src={categoryImage} 
                  alt={product.category} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="text-white font-medium drop-shadow-md">View {product.category}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChevronRight className="w-4 h-4 mx-2" />
      <span className="text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-sm">{product.name}</span>
    </div>
  );
}
