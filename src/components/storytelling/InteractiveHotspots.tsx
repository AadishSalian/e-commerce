'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const hotspots = [
  {
    id: '01',
    title: 'Hand Stitching',
    description: 'Every stitch is carefully placed by hand using high-tensile thread for lifelong durability.',
    x: 30, // percentage from left
    y: 40, // percentage from top
  },
  {
    id: '02',
    title: 'Material',
    description: 'Selected for its durability, natural character, and ability to patina beautifully over time.',
    x: 65,
    y: 25,
  },
  {
    id: '03',
    title: 'Finish',
    description: 'Each final detail receives careful attention, burnished and sealed to perfection.',
    x: 75,
    y: 65,
  }
];

export default function InteractiveHotspots() {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  return (
    <section className="w-full py-24 md:py-40 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight text-foreground mb-4">
          Every Mark<br />
          Has A Story
        </h2>
        <p className="text-lg text-text-muted font-light max-w-2xl mx-auto">
          Hover over the details to explore the intention behind every decision.
        </p>
      </div>

      <div className="max-w-5xl mx-auto relative px-6 md:px-0">
        <div className="relative w-full aspect-square md:aspect-[16/9] bg-surface rounded-2xl overflow-hidden shadow-2xl group border border-border">
          
          {/* Main Product Image with subtle zoom on active hotspot */}
          <motion.img 
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format&fit=crop"
            alt="Product detail"
            className="w-full h-full object-cover"
            animate={{ 
              scale: activeHotspot ? 1.05 : 1,
              filter: activeHotspot ? 'brightness(0.7)' : 'brightness(1)'
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Hotspots */}
          {hotspots.map((hotspot) => {
            const isActive = activeHotspot === hotspot.id;
            
            return (
              <div 
                key={hotspot.id}
                className="absolute z-10"
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                onMouseEnter={() => setActiveHotspot(hotspot.id)}
                onMouseLeave={() => setActiveHotspot(null)}
                onClick={() => setActiveHotspot(isActive ? null : hotspot.id)}
              >
                {/* Hotspot Dot */}
                <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer group/dot">
                  {/* Outer pulse */}
                  <motion.div 
                    className="absolute inset-0 bg-accent rounded-full opacity-30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Inner dot */}
                  <div className={`w-4 h-4 rounded-full border-[2px] border-white transition-colors duration-300 ${isActive ? 'bg-accent' : 'bg-transparent group-hover/dot:bg-accent/50'}`} />
                </div>

                {/* Info Panel */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute top-8 left-1/2 -translate-x-1/2 w-64 bg-background/90 backdrop-blur-xl border border-border p-6 rounded-xl shadow-2xl pointer-events-none"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-bold text-accent tracking-widest">{hotspot.id}</span>
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">{hotspot.title}</h4>
                      </div>
                      <p className="text-sm text-text-muted leading-relaxed font-light">
                        {hotspot.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
