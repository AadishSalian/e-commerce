'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useTransform, 
  useReducedMotion,
  useMotionValue,
  useMotionValueEvent,
  animate
} from 'framer-motion';
import { ArrowLeft, Plus, ChevronRight, Check } from 'lucide-react';
import { MOCK_PRODUCTS } from '@/lib/mockData';

// Shared animation transition for non-scroll-linked animations
const customEase = [0.65, 0, 0.35, 1] as const;
const defaultTransition = { duration: 1, ease: customEase };

// Pre-split text helper for stagger effects
const SplitText = ({ children, delayOffset = 0, className = "" }: { children: string, delayOffset?: number, className?: string }) => {
  const words = children.split(" ");
  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "100%" },
              visible: { y: 0 }
            }}
            transition={{ duration: 0.8, ease: customEase, delay: delayOffset + i * 0.05 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

// Animated Counter Helper
const AnimatedCounter = ({ from = 0, to, duration = 2 }: { from?: number, to: number, duration?: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useRef(false);

  useEffect(() => {
    if (!nodeRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isInView.current) {
        isInView.current = true;
        animate(from, to, {
          duration,
          ease: "easeOut",
          onUpdate: (latest) => {
            if (nodeRef.current) nodeRef.current.textContent = Math.round(latest).toString();
          }
        });
      }
    }, { threshold: 0.5 });
    
    observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [from, to, duration]);

  return <span ref={nodeRef}>{from}</span>;
};

const featuresList = [
  { eyebrow: "01 — Material", title: "Matte-finish shell.", desc: "A soft-touch surface engineered to resist fingerprints and glare, finished by hand." },
  { eyebrow: "02 — Endurance", title: "Days of playback.", desc: "A custom high-density cell delivers up to 40 hours of continuous, high-fidelity listening on a single charge." },
  { eyebrow: "03 — Detail", title: "Considered hardware.", desc: "Small functional details, refined until nothing was left to simplify further." }
];

export default function ElectronicsFlagshipPage() {
  const prefersReducedMotion = useReducedMotion();
  
  // Section 7: CTA Bar state
  const [showCtaBar, setShowCtaBar] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    // Show sticky CTA after scrolling past the hero (roughly 800px)
    if (latest > 800) setShowCtaBar(true);
    else setShowCtaBar(false);
  });

  // Hero animation variants
  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };
  const heroItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: defaultTransition }
  };

  const techProducts = MOCK_PRODUCTS.filter(p => p.category === 'Tech');

  // Section 6: Configurator logic
  const [activeColor, setActiveColor] = useState('onyx');
  const colors = [
    { id: 'onyx', name: 'Onyx Black', hex: '#111111', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop' },
    { id: 'bone', name: 'Bone White', hex: '#e8e8e6', img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1200&auto=format&fit=crop' },
  ];
  const currentVariant = colors.find(c => c.id === activeColor) || colors[0];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e8e8e6] selection:bg-accent selection:text-white font-sans overflow-x-hidden">
      
      {/* Navbar overlay block to keep back button clean */}
      <div className="fixed top-8 left-4 md:left-8 z-50">
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-[#e8e8e6] transition-colors font-medium text-xs tracking-[0.2em] uppercase">
          <ArrowLeft className="w-4 h-4" /> Store
        </Link>
      </div>

      {/* 1. Hero Section */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center px-4 overflow-hidden">
        <motion.div 
          className="absolute inset-0 z-0 flex items-center justify-center"
          animate={prefersReducedMotion ? {} : { y: [0, -15, 0] }}
          transition={{ repeat: Infinity, repeatType: "mirror", duration: 6, ease: "easeInOut" }}
        >
          <img 
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1600&auto=format&fit=crop" 
            alt="Monolith Over-Ears" 
            className="w-full h-full object-cover opacity-60 mix-blend-screen scale-110"
          />
          {/* Vignette fade to dark */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-[#0d0d0d]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-transparent to-[#0d0d0d]" />
        </motion.div>

        <motion.div 
          className="relative z-10 text-center flex flex-col items-center mt-32"
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={heroItemVariants} className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-4 text-white">
            Gadgets/Electronic
          </motion.h1>
          <motion.p variants={heroItemVariants} className="text-xl md:text-3xl text-text-muted tracking-tight font-light mb-12 max-w-2xl">
            Silence is the ultimate luxury.
          </motion.p>
          
          <motion.div variants={heroItemVariants} transition={{ delay: 0.4 }} className="flex flex-col items-center gap-4">
            <span className="font-mono text-sm tracking-[0.2em] text-white/50">From $349</span>
            <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform">
              Buy Now
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. Featured Tech Products Grid */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-16 flex justify-between items-end">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Latest Tech</h2>
            <p className="text-text-muted text-sm md:text-base tracking-wide max-w-lg">
              Precision-engineered hardware for the uncompromising minimalist.
            </p>
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16"
        >
          <AnimatePresence>
            {techProducts.map((product, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.8, delay: (idx % 3) * 0.1, ease: [0.65, 0, 0.35, 1] }}
                key={product.id}
                className="group cursor-pointer"
              >
                <Link href={`/products/${product.id}`} className="block">
                  {/* Image Container */}
                  <div className="w-full aspect-[4/5] bg-[#111] overflow-hidden mb-6 relative rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                    {product.isNew && (
                      <span className="absolute top-4 left-4 z-20 bg-white text-black px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                        New
                      </span>
                    )}
                    
                    <motion.img 
                      src={product.image} 
                      alt={product.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    
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
                  
                  {/* Details */}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="text-white font-bold tracking-tight text-lg mb-1">{product.name}</h3>
                      <p className="text-text-muted text-xs uppercase tracking-wider font-medium">
                        {product.variants?.length > 0 ? `${product.variants.length} Colors` : '1 Color'}
                      </p>
                    </div>
                    <p className="text-white font-medium">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 3. Material & Build Storytelling */}
      <section className="py-32 w-full bg-[#111]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.4 }}
            className="mb-24 text-center md:text-left max-w-3xl"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              <SplitText>Machined from a single block of aerospace grade aluminum.</SplitText>
            </h2>
            <p className="text-xl text-text-muted font-light">
              We eliminated plastic entirely. The structural integrity of the Monolith comes from its unibody chassis, bead-blasted to a matte perfection that resists fingerprints and wear.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: customEase }}
              className="aspect-square bg-[#1a1a1a] rounded-2xl overflow-hidden relative"
            >
              <img src="https://images.unsplash.com/photo-1628202926206-c63a34b19fb4?q=80&w=1000&auto=format&fit=crop" alt="Material detail" className="w-full h-full object-cover opacity-70 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                <h3 className="text-xl font-bold mb-2">Tactile Dials</h3>
                <p className="text-text-muted">Knurled aluminum controls for precise volume and ANC adjustments without looking.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: customEase, delay: 0.2 }}
              className="aspect-square bg-[#1a1a1a] rounded-2xl overflow-hidden relative md:mt-16"
            >
              <img src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1000&auto=format&fit=crop" alt="Assembly detail" className="w-full h-full object-cover opacity-70 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                <h3 className="text-xl font-bold mb-2">Memory Foam</h3>
                <p className="text-text-muted">Viscoelastic cushions wrapped in synthetic protein leather form a perfect acoustic seal.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Specs Section (Imperative Counters) */}
      <section className="py-40 bg-[#0d0d0d] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="w-full md:w-1/2">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Performance defined.</h2>
            <p className="text-text-muted text-lg mb-12">Numbers don't tell the whole story, but they provide the foundation for an uncompromising auditory experience.</p>
            
            <div className="flex gap-12">
              <div>
                <div className="text-5xl font-bold text-accent mb-2">
                  <AnimatedCounter to={40} duration={2} /><span className="text-2xl">h</span>
                </div>
                <p className="text-sm font-mono uppercase tracking-widest text-text-muted">Battery Life</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-accent mb-2">
                  <AnimatedCounter to={40} duration={2.5} /><span className="text-2xl">mm</span>
                </div>
                <p className="text-sm font-mono uppercase tracking-widest text-text-muted">Custom Drivers</p>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2">
            <div className="w-full border-t border-white/10 flex py-6 justify-between">
              <span className="text-text-muted font-medium">Frequency Response</span>
              <span className="font-mono text-white">4Hz - 40,000Hz</span>
            </div>
            <div className="w-full border-t border-white/10 flex py-6 justify-between">
              <span className="text-text-muted font-medium">Connectivity</span>
              <span className="font-mono text-white">Bluetooth 5.3 + LE Audio</span>
            </div>
            <div className="w-full border-t border-white/10 flex py-6 justify-between">
              <span className="text-text-muted font-medium">Microphones</span>
              <span className="font-mono text-white">6x Beamforming array</span>
            </div>
            <div className="w-full border-y border-white/10 flex py-6 justify-between">
              <span className="text-text-muted font-medium">Weight</span>
              <span className="font-mono text-white">285g</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Comparison Module (Horizontal Drag) */}
      <section className="py-32 bg-[#111] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">The lineup.</h2>
          <p className="text-text-muted">Drag to explore the Monolith family.</p>
        </div>
        
        <motion.div 
          className="flex gap-8 px-4 md:px-8 cursor-grab active:cursor-grabbing w-max"
          drag="x"
          dragConstraints={{ left: -800, right: 0 }}
        >
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-[300px] md:w-[400px] flex-shrink-0 bg-[#1a1a1a] p-8 rounded-2xl"
          >
            <div className="aspect-square bg-[#0d0d0d] rounded-xl mb-8 flex items-center justify-center p-8">
              <img src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=500&auto=format&fit=crop" className="mix-blend-luminosity" alt="Earbuds" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Monolith Buds</h3>
            <p className="text-text-muted mb-6">In-ear perfection.</p>
            <p className="font-mono text-sm">$199</p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-[300px] md:w-[400px] flex-shrink-0 bg-accent/10 border border-accent/20 p-8 rounded-2xl"
          >
            <div className="aspect-square bg-[#0d0d0d] rounded-xl mb-8 flex items-center justify-center p-8">
              <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500&auto=format&fit=crop" className="mix-blend-luminosity" alt="Over Ears" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-accent">Monolith Over-Ears</h3>
            <p className="text-text-muted mb-6">The flagship experience.</p>
            <p className="font-mono text-sm">$349</p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-[300px] md:w-[400px] flex-shrink-0 bg-[#1a1a1a] p-8 rounded-2xl"
          >
            <div className="aspect-square bg-[#0d0d0d] rounded-xl mb-8 flex items-center justify-center p-8">
              <img src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=500&auto=format&fit=crop" className="mix-blend-luminosity" alt="Studio Monitors" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Monolith Studio</h3>
            <p className="text-text-muted mb-6">Reference grade output.</p>
            <p className="font-mono text-sm">$899</p>
          </motion.div>
        </motion.div>
      </section>

      {/* 6. Color/Variant Configurator */}
      <section className="py-32 bg-[#0d0d0d] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-16">
          
          <div className="w-full md:w-1/2 aspect-square relative bg-[#111] rounded-3xl overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentVariant.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, ease: customEase }}
                src={currentVariant.img} 
                alt={currentVariant.name}
                className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity"
              />
            </AnimatePresence>
          </div>

          <div className="w-full md:w-1/2">
            <h2 className="text-4xl font-bold tracking-tight mb-8">Make it yours.</h2>
            
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <span className="font-mono text-sm uppercase tracking-widest">Color</span>
                <span className="text-text-muted">{currentVariant.name}</span>
              </div>
              
              <div className="flex gap-4">
                {colors.map((color) => (
                  <button 
                    key={color.id}
                    onClick={() => setActiveColor(color.id)}
                    className="relative w-12 h-12 rounded-full flex items-center justify-center"
                  >
                    {activeColor === color.id && (
                      <motion.div 
                        layoutId="activeColorRing"
                        className="absolute inset-0 rounded-full border-2 border-white"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span 
                      className="w-10 h-10 rounded-full border border-white/10" 
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 py-4 bg-white text-black font-semibold rounded-full hover:scale-[1.02] transition-transform">
                Add to Bag — $349
              </button>
              <button className="w-14 h-14 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Closing Sticky CTA Bar */}
      <AnimatePresence>
        {showCtaBar && (
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#111]/90 backdrop-blur-xl border-t border-white/10 p-4 md:p-6"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="hidden md:flex flex-col">
                <span className="font-bold">Monolith Over-Ears</span>
                <span className="text-text-muted text-sm">{currentVariant.name}</span>
              </div>
              
              <div className="flex items-center gap-6 ml-auto w-full md:w-auto justify-between md:justify-end">
                <span className="font-mono">$349</span>
                <button className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                  Add to Bag <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
