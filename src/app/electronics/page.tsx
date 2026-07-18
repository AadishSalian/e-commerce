'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { ChevronDown, ArrowLeft } from 'lucide-react';

export default function ElectronicsPage() {
  const [sortBy, setSortBy] = useState('newest');
  
  const filteredProducts = MOCK_PRODUCTS.filter(p => p.category === 'Tech')
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
  
  // Parallax effects for interlocking images
  const img1Y = useTransform(lookbookScrollY, [0, 1], ["0%", "20%"]);
  const img2Y = useTransform(lookbookScrollY, [0, 1], ["10%", "-20%"]);
  const img3Y = useTransform(lookbookScrollY, [0, 1], ["-10%", "10%"]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full selection:bg-foreground selection:text-background transition-colors duration-300">
      
      {/* 1. Minimalist Hero Section */}
      <section className="relative pt-40 pb-20 w-full flex flex-col items-center justify-center px-4 max-w-6xl mx-auto text-center">
        
        {/* Back Button positioned to the side */}
        <div className="absolute top-12 left-4 md:left-8 z-20">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-foreground transition-colors font-medium text-sm tracking-widest uppercase"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl flex flex-col items-center relative z-10"
        >
          <div className="overflow-hidden mb-6 pb-2">
            <motion.h1 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="text-5xl md:text-7xl leading-tight font-bold tracking-tight text-foreground uppercase"
            >
              Electronics & Gadgets.
            </motion.h1>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-lg md:text-2xl text-text-muted mb-12 max-w-2xl font-light"
          >
            Engineered for performance. Designed for precision. Discover the next generation of intelligent hardware.
          </motion.p>
        </motion.div>
      </section>

      {/* Infinite Scrolling Marquee */}
      <div className="w-full overflow-hidden bg-foreground text-background py-5 border-y border-border">
        <motion.div 
          className="whitespace-nowrap flex gap-12 items-center text-sm md:text-base font-bold uppercase tracking-[0.2em]"
          animate={{ x: [0, -1035] }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
        >
          <span>✦ NEXT GEN TECH</span>
          <span>INTELLIGENT HARDWARE</span>
          <span>✦ PRECISION ENGINEERING</span>
          <span>STATE OF THE ART</span>
          <span>✦ THE INNOVATION SERIES</span>
          <span>NEXT GEN TECH</span>
          <span>✦ INTELLIGENT HARDWARE</span>
          <span>PRECISION ENGINEERING</span>
          <span>✦ STATE OF THE ART</span>
          <span>THE INNOVATION SERIES</span>
        </motion.div>
      </div>

      {/* 2. Premium Bento Image Showcase */}
      <section ref={lookbookRef} className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* Main Large Image (Spans 2 columns) */}
          <motion.div 
            className="md:col-span-2 aspect-[4/3] md:aspect-auto md:h-[700px] relative overflow-hidden rounded-[2rem] bg-surface group"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.img 
              style={{ y: img1Y, scale: 1.15 }}
              src="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1600&auto=format&fit=crop" 
              alt="Workspace and tech"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </motion.div>
          
          {/* Right Stacked Images (1 column) */}
          <div className="md:col-span-1 flex flex-col gap-6 md:gap-8 h-full">
            
            {/* Top Right Image */}
            <motion.div 
              className="aspect-square md:aspect-auto md:h-[calc(50%-1rem)] relative overflow-hidden rounded-[2rem] bg-surface group"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <motion.img 
                style={{ y: img2Y, scale: 1.15 }}
                src="https://images.unsplash.com/photo-1550009158-9effb6754098?q=80&w=1000&auto=format&fit=crop" 
                alt="Smart devices"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </motion.div>

            {/* Bottom Right Image */}
            <motion.div 
              className="aspect-[4/3] md:aspect-auto md:h-[calc(50%-1rem)] relative overflow-hidden rounded-[2rem] bg-surface group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            >
              <motion.img 
                style={{ y: img3Y, scale: 1.15 }}
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop" 
                alt="Premium audio"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. Interactive Product Grid */}
      <section className="pb-32 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-border pb-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground uppercase">
            The Collection
          </h2>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 mt-6 md:mt-0 shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Sort</span>
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-transparent border-b border-border text-foreground text-sm font-bold uppercase tracking-wider px-2 py-2 pr-8 focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="w-4 h-4 text-foreground absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16"
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
                  <div className="w-full aspect-[4/5] bg-surface overflow-hidden mb-6 relative rounded-sm border border-transparent hover:border-border/50 transition-colors">
                    {product.isNew && (
                      <span className="absolute top-4 left-4 z-20 bg-foreground text-background px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                        New
                      </span>
                    )}
                    
                    {/* Primary Image */}
                    <motion.img 
                      src={product.image} 
                      alt={product.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    
                    {/* Hover Image */}
                    {product.hoverImage && (
                      <motion.img 
                        src={product.hoverImage} 
                        alt={`${product.name} alternate view`} 
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    )}
                  </div>
                  
                  {/* Product Details - Premium Minimalist style */}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="text-foreground font-bold tracking-tight uppercase text-sm mb-1">{product.name}</h3>
                      <p className="text-text-muted text-xs uppercase tracking-wider font-medium">{product.variants?.length > 0 ? `${product.variants.length} Colors` : '1 Color'}</p>
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
            <p className="text-text-muted text-lg uppercase tracking-widest">The collection is currently empty.</p>
          </div>
        )}
      </section>

    </div>
  );
}
