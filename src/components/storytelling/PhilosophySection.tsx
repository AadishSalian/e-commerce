'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function PhilosophySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section 
      ref={containerRef}
      className="w-full h-screen bg-background relative overflow-hidden flex items-center"
    >
      {/* Massive Background Typography */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
      >
        <h2 className="text-[28vw] font-serif font-bold uppercase tracking-tighter text-foreground opacity-[0.03] leading-none whitespace-nowrap">
          TIME
        </h2>
      </motion.div>

      {/* Foreground Content */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="md:col-span-8 md:col-start-2 flex flex-col justify-center relative z-20 py-12"
        >
          {/* Giant quotation mark for editorial styling */}
          <span className="absolute -top-4 -left-2 md:-top-24 md:-left-12 text-[100px] md:text-[180px] font-serif text-accent opacity-20 leading-none select-none z-0">
            &ldquo;
          </span>
          
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-8 block relative z-10">
            From the Workshop
          </span>
          
          <h3 className="text-2xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight text-foreground mb-12 leading-[1.2] relative z-10 max-w-4xl bg-background/50 backdrop-blur-sm p-4 md:p-0 md:bg-transparent md:backdrop-blur-none rounded-lg">
            If you try to rush the burnishing, the material fights back. You have to wait for it. You can't force the hide to take a shape it hasn't earned.
          </h3>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-[1px] bg-accent" />
            <div>
              <p className="font-serif font-bold text-foreground tracking-wider uppercase text-sm">Marcus</p>
              <p className="text-xs text-text-muted tracking-widest uppercase mt-1">Master Leatherworker, 24 Yrs</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
