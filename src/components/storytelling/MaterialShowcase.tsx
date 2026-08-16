'use client';

import React, { useState, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const materials = [
  {
    id: 'leather',
    name: 'Leather',
    tagline: 'Naturally textured.',
    description: 'Carefully selected full-grain leather that develops a unique patina over time, telling the story of its journey with you.',
    image: '/images/craft-final.jpg',
  },
  {
    id: 'wood',
    name: 'Wood',
    tagline: 'Responsibly sourced.',
    description: 'Solid hardwoods chosen for their distinct grain patterns and strength, hand-finished to a smooth, resilient surface.',
    image: '/images/craft-hero.jpg',
  },
  {
    id: 'metal',
    name: 'Metal',
    tagline: 'Precision engineered.',
    description: 'Aerospace-grade aluminum and brass accents, machined to exacting tolerances for both function and aesthetic brilliance.',
    image: '/images/craft-tools.jpg',
  },
  {
    id: 'fabric',
    name: 'Fabric',
    tagline: 'Woven for resilience.',
    description: 'High-density technical weaves and natural fibers combined to offer breathability without sacrificing durability.',
    image: '/images/craft-stitch.jpg',
  }
];

export default function MaterialShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [spotlightStyle, setSpotlightStyle] = useState({ opacity: 0, x: 0, y: 0 });

  const activeMaterial = materials[activeIndex];

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSpotlightStyle({
      opacity: 1,
      x,
      y
    });
  };

  const handleMouseLeave = () => {
    setSpotlightStyle({ ...spotlightStyle, opacity: 0 });
  };

  return (
    <section className="w-full py-24 md:py-32 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight text-foreground mb-4">
          Materials<br />
          We Choose
        </h2>
      </div>

      <div className="w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12 px-6">
          {materials.map((mat, idx) => (
            <button
              key={mat.id}
              onClick={() => setActiveIndex(idx)}
              className={`text-sm md:text-base font-bold uppercase tracking-widest px-4 py-2 transition-colors duration-300 relative ${activeIndex === idx ? 'text-foreground' : 'text-text-muted hover:text-foreground'}`}
            >
              {mat.name}
              {activeIndex === idx && (
                <motion.div 
                  layoutId="materialTabIndicator"
                  className="absolute bottom-0 left-0 w-full h-[2px] bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Interactive Image Container */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-surface overflow-hidden cursor-crosshair"
        >
          {/* Spotlight Effect (Desktop only) */}
          <div 
            className="hidden md:block absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 mix-blend-overlay"
            style={{
              opacity: spotlightStyle.opacity,
              background: `radial-gradient(circle 200px at ${spotlightStyle.x}px ${spotlightStyle.y}px, rgba(255,255,255,0.4) 0%, transparent 80%)`
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeMaterial.id}
              initial={{ opacity: 0, clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)' }}
              animate={{ opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)' }}
              exit={{ opacity: 0, clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <img 
                src={activeMaterial.image} 
                alt={activeMaterial.name} 
                className="w-full h-full object-cover grayscale-[10%]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Content Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${activeMaterial.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                className="absolute bottom-0 left-0 md:left-24 md:bottom-24 w-full md:w-[500px] bg-background p-8 md:p-12 border border-border pointer-events-auto"
              >
                <p className="text-xl md:text-3xl font-serif text-foreground mb-4 uppercase tracking-widest">{activeMaterial.tagline}</p>
                <p className="text-sm md:text-base text-text-muted font-light leading-relaxed mb-8">
                  {activeMaterial.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-text-muted uppercase">
                  <span>0{activeIndex + 1}</span>
                  <div className="w-12 h-[1px] bg-border" />
                  <span>0{materials.length}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
