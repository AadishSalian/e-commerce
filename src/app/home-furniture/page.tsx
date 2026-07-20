'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  motion, 
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence
} from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { MOCK_PRODUCTS } from '@/lib/mockData';

const customEase = [0.65, 0, 0.35, 1] as const;

export default function HomeFurniturePage() {
  const prefersReducedMotion = useReducedMotion();
  const homeProducts = MOCK_PRODUCTS.filter(p => p.category === 'Home & Furniture');

  // Filtering State
  const [activeRoom, setActiveRoom] = useState<string>('All Rooms');
  const [activeType, setActiveType] = useState<string>('All Types');
  const [activeStyle, setActiveStyle] = useState<string>('All Styles');

  const rooms = ['All Rooms', 'Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor'];
  const productTypes = ['All Types', 'Sofas', 'Chairs', 'Tables', 'Storage', 'Beds', 'Lighting'];
  const stylesList = ['All Styles', 'Modern', 'Minimalist', 'Traditional', 'Industrial'];

  const filteredProducts = useMemo(() => {
    return homeProducts.filter(p => {
      const attrs = (p as any).attributes || {};
      const roomMatch = activeRoom === 'All Rooms' || (attrs.room && attrs.room.includes(activeRoom));
      const typeMatch = activeType === 'All Types' || attrs.productType === activeType;
      const styleMatch = activeStyle === 'All Styles' || attrs.style === activeStyle;
      return roomMatch && typeMatch && styleMatch;
    });
  }, [homeProducts, activeRoom, activeType, activeStyle]);

  // Products for "The Reading Nook" section
  const chair = homeProducts.find(p => p.id === 'p-9');
  const lamp = homeProducts.find(p => p.id === 'h-2');
  const table = homeProducts.find(p => p.id === 'h-3');

  // Editorial Parallax
  const lookbookRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: lookbookScrollY } = useScroll({
    target: lookbookRef,
    offset: ["start end", "end start"]
  });
  
  const img1Y = useTransform(lookbookScrollY, [0, 1], ["0%", "15%"]);
  const img2Y = useTransform(lookbookScrollY, [0, 1], ["10%", "-10%"]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background font-sans overflow-x-hidden">
      
      {/* 1. Immersive Hero Section */}
      <section className="relative min-h-[80vh] w-full pt-32 pb-16 px-4 md:px-8 flex items-center justify-center overflow-hidden">
        {/* Background Image full bleed with overlay */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: customEase }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2000&auto=format&fit=crop" 
            alt="Beautiful minimal living space" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: customEase }}
          className="relative z-10 text-center max-w-4xl mx-auto mt-20"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-foreground leading-[1.1]">
            Space &<br />Form.
          </h1>
          <p className="text-xl md:text-2xl text-foreground font-medium mb-8 max-w-2xl mx-auto drop-shadow-sm">
            Elevate your living space with our collection of minimalist furniture and home essentials. Designed to anchor your daily rituals.
          </p>
        </motion.div>
      </section>

      {/* 2. Editorial Section - The Sanctuary */}
      <section ref={lookbookRef} className="py-32 w-full bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Asymmetrical Images */}
            <div className="w-full lg:w-1/2 relative h-[600px]">
              <motion.div 
                style={{ y: img1Y }}
                className="absolute top-0 left-0 w-2/3 h-4/5 rounded-3xl overflow-hidden shadow-2xl bg-muted"
              >
                <img 
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop" 
                  alt="Minimalist interior"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div 
                style={{ y: img2Y }}
                className="absolute bottom-0 right-0 w-1/2 h-3/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-background bg-muted z-10"
              >
                <img 
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop" 
                  alt="Ceramics and textures"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: customEase }}
              className="w-full lg:w-1/2"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">The Sanctuary.</h2>
              <p className="text-lg text-text-muted mb-8 leading-relaxed">
                Your home is your most intimate environment. We create objects that respect the silence of a room. Natural woods, heavy ceramics, and tactile fabrics that age gracefully alongside you.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-foreground font-semibold hover:text-accent transition-colors pb-1 border-b border-foreground hover:border-accent">
                Discover our materials <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. Filtered Product Grid */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full bg-background" id="collection">
        
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-10">Shop by Room.</h2>
          
          {/* Primary Filter: Room */}
          <div className="flex flex-wrap gap-3 mb-8">
            {rooms.map(room => (
              <button
                key={room}
                onClick={() => setActiveRoom(room)}
                className={`px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-300 ${
                  activeRoom === room 
                    ? 'bg-foreground text-background shadow-lg scale-105' 
                    : 'bg-muted text-text-muted hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {room}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Type & Style */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
            <span className="text-sm font-medium text-text-muted mr-2">Filter by:</span>
            
            <div className="relative">
              <select 
                value={activeType}
                onChange={(e) => setActiveType(e.target.value)}
                className="appearance-none bg-surface border border-border text-foreground text-sm font-medium px-4 py-2 pr-10 rounded-full focus:outline-none focus:border-foreground transition-colors cursor-pointer"
              >
                {productTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
            </div>

            <div className="relative">
              <select 
                value={activeStyle}
                onChange={(e) => setActiveStyle(e.target.value)}
                className="appearance-none bg-surface border border-border text-foreground text-sm font-medium px-4 py-2 pr-10 rounded-full focus:outline-none focus:border-foreground transition-colors cursor-pointer"
              >
                {stylesList.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
            </div>
            
            {(activeRoom !== 'All Rooms' || activeType !== 'All Types' || activeStyle !== 'All Styles') && (
              <button 
                onClick={() => { setActiveRoom('All Rooms'); setActiveType('All Types'); setActiveStyle('All Styles'); }}
                className="text-sm text-text-muted hover:text-foreground underline underline-offset-4 ml-4 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        
        {filteredProducts.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-16">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: customEase }}
                  key={product.id}
                  className="group cursor-pointer"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="w-full aspect-[4/3] bg-muted overflow-hidden mb-6 relative rounded-2xl">
                      {product.isNew && (
                        <span className="absolute top-4 left-4 z-20 bg-foreground text-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                          New
                        </span>
                      )}
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                      />
                      {product.hoverImage && (
                        <img 
                          src={product.hoverImage} 
                          alt={`${product.name} alternate view`} 
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[0.16,1,0.3,1] z-10"
                        />
                      )}
                    </div>
                    
                    <div className="flex justify-between items-start px-1">
                      <div className="flex flex-col">
                        <h3 className="text-foreground font-semibold tracking-tight text-xl mb-1">{product.name}</h3>
                        <p className="text-text-muted text-sm tracking-wide font-medium">
                          {product.variants?.length > 0 ? `${product.variants.length} Options` : '1 Option'}
                        </p>
                      </div>
                      <p className="text-foreground font-medium text-lg">${product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="py-24 text-center bg-muted/30 rounded-[2rem] border border-border border-dashed">
            <h3 className="text-2xl font-bold mb-3 text-foreground">No items found</h3>
            <p className="text-text-muted text-lg max-w-md mx-auto mb-8">
              We couldn't find any furniture matching those specific filters. Try adjusting your room, style, or type.
            </p>
            <button 
              onClick={() => { setActiveRoom('All Rooms'); setActiveType('All Types'); setActiveStyle('All Styles'); }}
              className="px-8 py-4 bg-foreground text-background rounded-full font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-opacity"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* 4. Curated Space */}
      <section className="py-32 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">The Reading Nook.</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              A curated space designed for focus and relaxation. Perfectly proportioned pieces that speak to each other.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left">
            {[chair, lamp, table].map((item, idx) => item && (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: customEase }}
                className="bg-card p-6 rounded-[2rem] border border-border shadow-sm hover:shadow-md hover:border-foreground/20 transition-all duration-300 group flex flex-col"
              >
                <div className="aspect-[4/5] bg-muted rounded-2xl mb-6 overflow-hidden relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{item.name}</h3>
                <p className="text-text-muted text-sm mb-6 flex-grow">{item.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                  <span className="font-medium text-foreground">${item.price.toFixed(2)}</span>
                  <Link href={`/products/${item.id}`} className="text-sm font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors">
                    Shop
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
    </div>
  );
}
