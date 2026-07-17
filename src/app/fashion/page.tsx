'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { ChevronDown, ArrowLeft } from 'lucide-react';

export default function FashionPage() {
  const [sortBy, setSortBy] = useState('newest');
  
  const filteredProducts = MOCK_PRODUCTS.filter(p => p.category === 'Fashion')
  .sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0; // default 'newest'
  });

  // Editorial Section Logic
  const lookbookRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: lookbookScrollY } = useScroll({
    target: lookbookRef,
    offset: ["start end", "end start"]
  });
  const img1Y = useTransform(lookbookScrollY, [0, 1], ["-10%", "10%"]);
  const img2Y = useTransform(lookbookScrollY, [0, 1], ["10%", "-10%"]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full selection:bg-foreground selection:text-background transition-colors duration-300">
      
      {/* 1. Minimalist Hero Section */}
      <section className="relative pt-40 pb-16 w-full flex flex-col items-center justify-center px-4 max-w-6xl mx-auto text-center">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-foreground transition-colors mb-10 font-medium text-sm tracking-widest uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl flex flex-col items-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
            Fashion & Apparel.
          </h1>
          <p className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl">
            Tactile, restrained, and meticulously tailored. Experience a new standard of premium apparel designed without compromise.
          </p>
        </motion.div>
      </section>

      {/* 2. Lookbook Gallery (Minimalist Layout) */}
      <section ref={lookbookRef} className="pb-32 px-4 md:px-8 max-w-6xl mx-auto w-full overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          
          <div className="w-full md:w-1/2">
            <motion.div 
              className="aspect-[4/5] relative overflow-hidden rounded-2xl bg-surface"
              initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
              whileInView={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.img 
                style={{ y: img1Y, scale: 1.1 }}
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
                alt="Editorial 1"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
          
          <div className="w-full md:w-1/2 md:mt-32">
            <motion.div 
              className="aspect-square w-full relative overflow-hidden rounded-2xl bg-surface"
              initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
              whileInView={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <motion.img 
                style={{ y: img2Y, scale: 1.15 }}
                src="https://images.unsplash.com/photo-1550614000-4b95f463cb1e?q=80&w=1000&auto=format&fit=crop" 
                alt="Editorial 2"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Product Grid */}
      <section className="pb-32 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            The Pieces
          </h2>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 mt-6 md:mt-0 shrink-0">
            <span className="text-sm font-medium text-text-muted">Sort</span>
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface border border-border text-foreground text-sm font-medium px-4 py-2 pr-10 rounded-full focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
        >
          <AnimatePresence>
            {filteredProducts.map((product, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.8, delay: (idx % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                key={product.id}
                className="group cursor-pointer"
              >
                <Link href={`/products/${product.id}`} className="block">
                  {/* Image Container with Hover Crossfade */}
                  <div className="w-full aspect-[4/5] bg-surface overflow-hidden mb-5 relative rounded-2xl">
                    {product.isNew && (
                      <span className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-foreground">
                        New
                      </span>
                    )}
                    
                    {/* Primary Image */}
                    <motion.img 
                      src={product.image} 
                      alt={product.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    
                    {/* Hover Image */}
                    {product.hoverImage && (
                      <motion.img 
                        src={product.hoverImage} 
                        alt={`${product.name} alternate view`} 
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 z-10" />
                  </div>
                  
                  {/* Product Details - Minimalist style */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-foreground font-medium mb-1">{product.name}</h3>
                      <p className="text-text-muted text-sm">{product.variants?.length > 0 ? `${product.variants.length} Colors` : '1 Color'}</p>
                    </div>
                    <p className="text-foreground font-medium">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-text-muted text-lg">The collection is currently empty.</p>
          </div>
        )}
      </section>

    </div>
  );
}
