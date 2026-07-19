'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { 
  motion, 
  useReducedMotion,
} from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { MOCK_PRODUCTS } from '@/lib/mockData';

const customEase = [0.65, 0, 0.35, 1] as const;

export default function ElectronicsCategoryPage() {
  const prefersReducedMotion = useReducedMotion();
  const techProducts = MOCK_PRODUCTS.filter(p => p.category === 'Tech');

  // We can pick a few specific products for the "Shop the Setup" section
  const monitor = techProducts.find(p => p.id === 't-5');
  const keyboard = techProducts.find(p => p.id === 't-1');
  const mouse = techProducts.find(p => p.id === 't-6');

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-white font-sans overflow-x-hidden">
      
      {/* 1. Hero Section - The Tech Collection */}
      <section className="relative min-h-[70vh] w-full pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: customEase }}
          className="z-10 text-center md:text-left w-full md:w-1/2 lg:w-3/5"
        >
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold tracking-tighter mb-6 text-foreground leading-[1.1]">
            The Tech<br />Collection.
          </h1>
          <p className="text-xl md:text-2xl text-text-muted tracking-tight font-light mb-8 max-w-lg mx-auto md:mx-0">
            Precision-engineered objects for your digital workflow. Built to last, designed to disappear.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: customEase, delay: 0.2 }}
          className="w-full md:w-1/2 lg:w-2/5 relative aspect-square max-w-md mx-auto md:mx-0 rounded-3xl overflow-hidden border border-border/50 shadow-2xl mt-8 md:mt-0"
        >
          <motion.img 
            src="/images/tech_gadgets_knolling.png" 
            alt="Futuristic Tech Gadgets Knolling Layout" 
            className="w-full h-full object-cover opacity-100 scale-110"
            animate={{ y: [0, -10, 0], rotate: [0, -2, 0] }}
            transition={{ repeat: Infinity, repeatType: "mirror", duration: 6, ease: "easeInOut" }}
          />
          {/* Subtle gradient overlay to blend with background */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        </motion.div>

        {/* Decorative ambient background elements */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[50%] h-[80%] rounded-full bg-accent/5 blur-[120px] -z-10" />
      </section>

      {/* 2. Category Storytelling - Ecosystem */}
      <section className="py-32 w-full bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: customEase }}
              className="w-full lg:w-1/2 aspect-square md:aspect-[4/3] bg-background rounded-3xl overflow-hidden relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1200&auto=format&fit=crop" 
                alt="Unified Ecosystem" 
                className="w-full h-full object-cover opacity-80" 
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: customEase, delay: 0.2 }}
              className="w-full lg:w-1/2"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Unified Ecosystem.</h2>
              <p className="text-lg text-text-muted mb-8 leading-relaxed">
                Our devices are designed not just as individual tools, but as a cohesive ecosystem. 
                From the tactile feedback of the mechanical switches to the visual clarity of the reference display, 
                every component communicates seamlessly to keep you in the flow.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-foreground font-medium hover:text-accent transition-colors">
                Read the design philosophy <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Category Storytelling - Material Obsession */}
      <section className="py-32 w-full bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: customEase }}
              className="w-full lg:w-1/2"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Material Obsession.</h2>
              <p className="text-lg text-text-muted mb-8 leading-relaxed">
                We believe in truth to materials. Aerospace-grade aluminum, sapphire glass, and high-density ceramics. 
                No superficial coatings. The texture you feel is the structural material itself, bead-blasted and anodized for lasting durability.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: customEase, delay: 0.2 }}
              className="w-full lg:w-1/2 aspect-square md:aspect-[4/3] bg-muted rounded-3xl overflow-hidden relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1200&auto=format&fit=crop" 
                alt="Material Close Up" 
                className="w-full h-full object-cover opacity-100 scale-110" 
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Full Product Grid */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {techProducts.map((product, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ duration: 0.8, delay: (idx % 3) * 0.1, ease: customEase }}
              key={product.id}
              className="group cursor-pointer"
            >
              <Link href={`/products/${product.id}`} className="block">
                <div className="w-full aspect-[4/5] bg-muted/50 overflow-hidden mb-6 relative rounded-2xl border border-border/50 group-hover:border-border transition-all duration-500">
                  {product.isNew && (
                    <span className="absolute top-4 left-4 z-20 bg-foreground text-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      New
                    </span>
                  )}
                  <motion.img 
                    src={product.image} 
                    alt={product.name} 
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 ease-in-out"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  {product.hoverImage && (
                    <motion.img 
                      src={product.hoverImage} 
                      alt={`${product.name} alternate view`} 
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
                    />
                  )}
                </div>
                
                <div className="flex justify-between items-start px-2">
                  <div className="flex flex-col">
                    <h3 className="text-foreground font-semibold tracking-tight text-lg mb-1">{product.name}</h3>
                    <p className="text-text-muted text-xs uppercase tracking-wider font-medium">
                      {product.variants?.length > 0 ? `${product.variants.length} Colors` : '1 Color'}
                    </p>
                  </div>
                  <p className="text-foreground font-medium">${product.price.toFixed(2)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Shop the Setup */}
      <section className="py-32 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Build your setup.</h2>
          <p className="text-text-muted text-lg mb-16 max-w-2xl mx-auto">
            Curated essentials for the ultimate workstation. Everything you need, nothing you don't.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[monitor, keyboard, mouse].map((item, idx) => item && (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: customEase }}
                className="bg-card p-6 rounded-2xl border border-border/50 hover:border-border transition-colors group flex flex-col"
              >
                <div className="aspect-square bg-muted rounded-xl mb-6 overflow-hidden relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{item.name}</h3>
                <p className="text-text-muted text-sm mb-6 flex-grow">{item.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-mono text-foreground">${item.price.toFixed(2)}</span>
                  <Link href={`/products/${item.id}`} className="text-sm font-semibold uppercase tracking-wider text-accent hover:text-foreground transition-colors">
                    View Product
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
