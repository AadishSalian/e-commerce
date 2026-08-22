'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Layers } from 'lucide-react';
import { Product } from '@/lib/mockData';
import { useQuickView } from '@/contexts/QuickViewContext';
import { useCompare } from '@/contexts/CompareContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Heart } from 'lucide-react';
import { useRef, useState } from 'react';

type ProductCardProps = {
  product: Product;
  variant?: 'default' | 'editorial' | 'carousel';
};


const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const getBlurDataURL = () => `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`;

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { openQuickView } = useQuickView();
  const { addToCompare } = useCompare();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [showWishlistAnimation, setShowWishlistAnimation] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [wasLongPressed, setWasLongPressed] = useState(false);

  const handlePointerDown = () => {
    setWasLongPressed(false);
    longPressTimer.current = setTimeout(() => {
      setWasLongPressed(true);
      toggleWishlist(product);
      setShowWishlistAnimation(true);
      
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      
      setTimeout(() => {
        setShowWishlistAnimation(false);
      }, 1000);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (wasLongPressed) {
      e.preventDefault();
    }
  };

  // Badge Styling based on Tier
  const tierStyles = {
    Good: 'bg-zinc-300 text-zinc-900',
    Better: 'bg-slate-300 text-slate-900',
    Best: 'bg-amber-400 text-amber-950',
  };

  if (variant === 'editorial') {
    return (
      <div className="group cursor-pointer">
        <Link 
          href={`/products/${product.id}`} 
          className="block relative select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleClick}
        >
          <AnimatePresence>
            {showWishlistAnimation && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.5 }}
                exit={{ opacity: 0, scale: 2 }}
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <Heart className={`w-16 h-16 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} drop-shadow-2xl />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-full aspect-[4/5] bg-surface overflow-hidden mb-6 relative rounded-sm border border-transparent hover:border-border/50 transition-colors">
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
              {product.isNew && (
                <span className="bg-foreground text-background px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-sm">
                  New
                </span>
              )}
              {product.tier && (
                <span className={`${tierStyles[product.tier]} px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-sm`}>
                  {product.tier}
                </span>
              )}
            </div>
            
            <motion.div 
              className="absolute inset-0 w-full h-full"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Image 
                src={product.image} 
                alt={product.name} 
                fill
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0"
                placeholder="blur"
                blurDataURL={getBlurDataURL()}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
            {product.hoverImage && (
              <motion.div 
                className="absolute inset-0 w-full h-full"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <Image 
                  src={product.hoverImage} 
                  alt={`${product.name} alternate view`} 
                  fill
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
                  placeholder="blur"
                  blurDataURL={getBlurDataURL()}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </motion.div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product); }}
                className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
                title="Quick View"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(product); }}
                className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
                title="Compare"
              >
                <Layers className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-foreground font-bold tracking-tight uppercase text-sm mb-1">{product.name}</h3>
              <p className="text-text-muted text-xs uppercase tracking-wider font-medium">{product.variants && product.variants.length > 0 ? `${product.variants.length} Colors` : '1 Color'}</p>
            </div>
            <p className="text-foreground font-medium">${product.price.toFixed(2)}</p>
          </div>
        </Link>
      </div>
    );
  }

  if (variant === 'carousel') {
    return (
      <motion.div
        whileHover={{ y: -4, borderColor: 'var(--border-hover, #3a3a3a)' }}
        className="snap-start shrink-0 w-[280px] md:w-[320px] aspect-[4/5] bg-surface rounded-xl border border-border flex flex-col p-6 transition-all duration-300 relative group cursor-pointer"
      >
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
          {product.isNew && (
             <span className="text-[10px] font-bold uppercase tracking-widest bg-[#8ed500] text-[#121212] px-2.5 py-1 rounded-sm shadow-sm">
               New
             </span>
          )}
          {product.tier && (
             <span className={`${tierStyles[product.tier]} text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm`}>
               {product.tier}
             </span>
          )}
        </div>
        
        {/* Link wraps only the image area so buttons inside can still be clicked if layered properly, 
            or we handle navigation entirely via Link and buttons use stopPropagation. */}
        <Link 
          href={`/products/${product.id}`} 
          className="block flex-1 bg-surface-hover rounded-lg mb-6 flex items-center justify-center overflow-hidden relative select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleClick}
        >
          <AnimatePresence>
            {showWishlistAnimation && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.5 }}
                exit={{ opacity: 0, scale: 2 }}
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <Heart className={`w-16 h-16 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} drop-shadow-2xl />
              </motion.div>
            )}
          </AnimatePresence>
           <Image 
             src={product.image} 
             alt={product.name} 
             fill
             className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
             placeholder="blur"
             blurDataURL={getBlurDataURL()}
             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
           />
           
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
             <button 
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product); }}
               className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
               title="Quick View"
             >
               <Eye className="w-5 h-5" />
             </button>
             <button 
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(product); }}
               className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
               title="Compare"
             >
               <Layers className="w-5 h-5" />
             </button>
           </div>
        </Link>
        
        <Link href={`/products/${product.id}`} className="flex justify-between items-end">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{product.category}</p>
            <h3 className="text-foreground font-medium">{product.name}</h3>
          </div>
          <p className="text-foreground font-medium">${product.price}</p>
        </Link>
      </motion.div>
    );
  }

  // Default variant
  return (
    <Link 
      href={`/products/${product.id}`} 
      className="group block relative select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
    >
      <AnimatePresence>
        {showWishlistAnimation && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <Heart className={`w-16 h-16 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} drop-shadow-2xl />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="w-full aspect-[4/5] bg-surface rounded-xl border border-transparent group-hover:border-border transition-colors duration-300 mb-6 flex flex-col p-2 relative overflow-hidden">
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 items-start">
          {product.isNew && (
            <span className="text-[10px] font-bold uppercase tracking-widest bg-[#8ed500] text-[#121212] px-2.5 py-1 rounded-sm shadow-sm">
              New
            </span>
          )}
          {product.tier && (
            <span className={`${tierStyles[product.tier]} text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm`}>
              {product.tier}
            </span>
          )}
        </div>
        <div className="flex-1 w-full bg-surface-hover rounded-lg flex items-center justify-center relative overflow-hidden">
          <Image 
             src={product.image} 
             alt={product.name} 
             fill
             className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
             placeholder="blur"
             blurDataURL={getBlurDataURL()}
             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
           />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product); }}
              className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
              title="Quick View"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(product); }}
              className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
              title="Compare"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-foreground font-medium text-lg mb-1">{product.name}</h3>
          <p className="text-text-muted text-sm">{product.variants && product.variants.length > 0 ? `${product.variants.length} Colors` : '1 Color'}</p>
        </div>
        <p className="text-foreground font-medium text-lg">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
