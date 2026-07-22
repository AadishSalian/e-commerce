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

export default function AccessoriesPage() {
  const prefersReducedMotion = useReducedMotion();
  const accessories = MOCK_PRODUCTS.filter(p => p.category === 'Accessories');

  // Filtering State
  const [activeType, setActiveType] = useState<string>('All Types');
  const [activeMaterial, setActiveMaterial] = useState<string>('All Materials');

  const types = ['All Types', 'Everyday Carry', 'Wearable', 'Bags & Luggage', 'Desk'];
  const materials = ['All Materials', 'Leather', 'Metal', 'Fabric', 'Acetate'];

  const filteredProducts = useMemo(() => {
    return accessories.filter(p => {
      const attrs = (p as any).attributes || {};
      const typeMatch = activeType === 'All Types' || attrs.accessoryType === activeType;
      const materialMatch = activeMaterial === 'All Materials' || attrs.material === activeMaterial;
      return typeMatch && materialMatch;
    });
  }, [accessories, activeType, activeMaterial]);

  // Products for "Everyday Essentials" section
  const essential1 = accessories.find(p => p.id === 'a-1'); // Wallet
  const essential2 = accessories.find(p => p.id === 'a-2'); // Pen
  const essential3 = accessories.find(p => p.id === 'a-8'); // Keychain

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
            src="https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=2000&auto=format&fit=crop" 
            alt="Premium everyday carry accessories" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: customEase }}
          className="relative z-10 text-center max-w-4xl mx-auto mt-20"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-foreground leading-[1.1]">
            The Final<br />Touch.
          </h1>
          <p className="text-xl md:text-2xl text-foreground font-medium mb-8 max-w-2xl mx-auto drop-shadow-sm">
            Elevate your daily routine with meticulously crafted essentials designed to outlast trends.
          </p>
        </motion.div>
      </section>

      {/* 2. Editorial Section - Technical Precision */}
      <section ref={lookbookRef} className="py-32 w-full bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            
            {/* Asymmetrical Images */}
            <div className="w-full lg:w-1/2 relative h-[600px]">
              <motion.div 
                style={{ y: img1Y }}
                className="absolute top-0 right-0 w-2/3 h-4/5 rounded-3xl overflow-hidden shadow-2xl bg-muted"
              >
                <img 
                  src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop" 
                  alt="Craftsmanship detail"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div 
                style={{ y: img2Y }}
                className="absolute bottom-0 left-0 w-1/2 h-3/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-background bg-muted z-10"
              >
                <img 
                  src="https://images.unsplash.com/photo-1505022610485-0249ba5b3675?q=80&w=600&auto=format&fit=crop" 
                  alt="Leather texture detail"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: customEase }}
              className="w-full lg:w-1/2"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Crafted for Life.</h2>
              <p className="text-lg text-text-muted mb-8 leading-relaxed">
                From full-grain Italian leather to precision-machined titanium, we source only the finest materials. Every stitch and bevel is considered, resulting in accessories that age beautifully alongside you.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-foreground font-semibold hover:text-accent transition-colors pb-1 border-b border-foreground hover:border-accent">
                Explore our materials <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. Filtered Product Grid */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full bg-background" id="collection">
        
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-10">Shop by Category.</h2>
          
          {/* Primary Filter: Type */}
          <div className="flex flex-wrap gap-3 mb-8">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-300 ${
                  activeType === type 
                    ? 'bg-foreground text-background shadow-lg scale-105' 
                    : 'bg-muted text-text-muted hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Material */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
            <span className="text-sm font-medium text-text-muted mr-2">Filter by:</span>
            
            <div className="relative">
              <select 
                value={activeMaterial}
                onChange={(e) => setActiveMaterial(e.target.value)}
                className="appearance-none bg-surface border border-border text-foreground text-sm font-medium px-4 py-2 pr-10 rounded-full focus:outline-none focus:border-foreground transition-colors cursor-pointer"
              >
                {materials.map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
            </div>
            
            {(activeType !== 'All Types' || activeMaterial !== 'All Materials') && (
              <button 
                onClick={() => { setActiveType('All Types'); setActiveMaterial('All Materials'); }}
                className="text-sm text-text-muted hover:text-foreground underline underline-offset-4 ml-4 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        
        {filteredProducts.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
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
                    <div className="w-full aspect-square bg-muted overflow-hidden mb-4 relative rounded-2xl">
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
                    
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-foreground font-semibold tracking-tight text-lg">{product.name}</h3>
                        <p className="text-foreground font-medium text-lg ml-4">${product.price.toFixed(2)}</p>
                      </div>
                      <p className="text-text-muted text-sm tracking-wide font-medium">
                        {(product as any).attributes?.material}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="py-24 text-center bg-muted/30 rounded-[2rem] border border-border border-dashed">
            <h3 className="text-2xl font-bold mb-3 text-foreground">No accessories found</h3>
            <p className="text-text-muted text-lg max-w-md mx-auto mb-8">
              We couldn't find any items matching those specific filters. Try adjusting your type or material.
            </p>
            <button 
              onClick={() => { setActiveType('All Types'); setActiveMaterial('All Materials'); }}
              className="px-8 py-4 bg-foreground text-background rounded-full font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-opacity"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* 4. Curated Routine */}
      <section className="py-32 bg-surface border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everyday Essentials.</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              The fundamental trio that forms the foundation of any refined everyday carry setup.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left">
            {[essential1, essential2, essential3].map((item, idx) => item && (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: customEase }}
                className="bg-background p-6 rounded-[2rem] border border-border shadow-sm hover:shadow-md hover:border-foreground/20 transition-all duration-300 group flex flex-col"
              >
                <div className="aspect-square bg-muted rounded-2xl mb-6 overflow-hidden relative">
                  <span className="absolute top-4 left-4 z-20 bg-background text-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm shadow-black/10">
                    EDC {idx + 1}
                  </span>
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
