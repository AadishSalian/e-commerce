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
          className="md:col-span-5 md:col-start-2 lg:col-start-2 flex flex-col justify-center"
        >
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-6 block">
            Our Philosophy
          </span>
          <h3 className="text-4xl md:text-5xl font-serif font-bold uppercase tracking-tight text-foreground mb-8 leading-[0.9]">
            Good Things<br />Take Time.
          </h3>
          <p className="text-sm md:text-base text-text-muted font-light leading-relaxed max-w-[280px]">
            Craftsmanship is not about speed. It is about intention. Every hour invested is an assurance of a lifetime of quality. We refuse to rush what is meant to endure.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
