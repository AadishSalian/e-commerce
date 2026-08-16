'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { HandwrittenAnnotation } from '../ui/HandwrittenAnnotation';

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
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section ref={containerRef} className="w-full py-24 md:py-40 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight text-foreground mb-4">
          Every Mark<br />
          Has A Story
        </h2>
        <p className="text-lg text-text-muted font-light max-w-2xl mx-auto">
          Hover over the details to explore the intention behind every decision.
        </p>
      </div>

      <div className="w-full relative">
        <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-surface group overflow-hidden">
          
          {/* Main Product Image with subtle zoom on active hotspot */}
          <motion.div className="absolute inset-0 w-full h-full" style={{ y: imageY, scale: 1.15 }}>
            <motion.img 
              src="/images/craft-5.svg"
              alt="Product detail"
              className="w-full h-full object-cover"
              animate={{ 
                scale: activeHotspot ? 1.05 : 1,
                filter: activeHotspot ? 'brightness(0.7)' : 'brightness(1)'
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>
          
          {/* Static Designer Annotations */}
          <HandwrittenAnnotation 
            text="Thread tension must be exact"
            className="top-[15%] left-[10%] hidden md:block"
            rotation={-5}
            lineDirection="bottom-right"
            delay={1}
          />
          <HandwrittenAnnotation 
            text="Natural grain variations"
            className="bottom-[15%] right-[10%] hidden md:block"
            rotation={3}
            lineDirection="top-left"
            delay={1.2}
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
                <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer group/dot flex items-center justify-center w-8 h-8">
                  {/* Outer pulse */}
                  <motion.div 
                    className="absolute inset-0 bg-accent rounded-full opacity-30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Inner dot */}
                  <div className={`relative z-10 w-4 h-4 rounded-full border-[2px] border-white transition-colors duration-300 ${isActive ? 'bg-accent' : 'bg-transparent group-hover/dot:bg-accent/50'}`} />
                </div>

                {/* Info Panel */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={`absolute top-12 w-64 bg-background border border-border p-6 shadow-none pointer-events-none z-50 ${
                        hotspot.x > 70 ? 'right-0' : hotspot.x < 30 ? 'left-0' : 'left-1/2 -translate-x-1/2'
                      }`}
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
