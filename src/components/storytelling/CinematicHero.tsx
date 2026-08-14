'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export default function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  
  // Parallax foreground elements
  const foregroundY1 = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const foregroundY2 = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      {/* Background Image with Parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{
          y: backgroundY,
          scale: backgroundScale,
        }}
      >
        {/* We use a high quality craftsmanship image for the hero */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542385154-20a2e379435f?q=80&w=2000&auto=format&fit=crop")' }}
        />
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </motion.div>

      {/* Multi-Layer Parallax Foreground Shots */}
      <motion.div 
        className="absolute top-1/4 right-24 md:right-48 w-48 aspect-[3/4] hidden md:block z-0 pointer-events-none opacity-80 mix-blend-screen"
        style={{ y: foregroundY1 }}
      >
        <img src="https://images.unsplash.com/photo-1590740523293-6a97825a07aa?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover grayscale brightness-125" alt="" />
      </motion.div>
      <motion.div 
        className="absolute bottom-1/4 left-12 md:left-32 w-64 aspect-[4/3] hidden md:block z-0 pointer-events-none opacity-60 mix-blend-screen"
        style={{ y: foregroundY2 }}
      >
        <img src="https://images.unsplash.com/photo-1537832816519-689ad163238b?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover grayscale brightness-125" alt="" />
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center text-center px-6"
        style={{ y: textY, opacity }}
      >
        <motion.h1 
          className="text-6xl md:text-8xl font-serif font-bold tracking-tight text-white uppercase mb-6 leading-[0.9]"
          initial={{ opacity: 0, filter: 'blur(10px)', y: 40 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          Crafted<br />
          By Hand.
        </motion.h1>

        <motion.p 
          className="text-lg md:text-2xl text-zinc-300 font-light max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
        >
          Where patience becomes something worth keeping.
        </motion.p>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-white/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <span className="text-xs font-semibold tracking-[0.2em] uppercase mb-4">
          Scroll to discover
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-5 h-5 opacity-70" />
        </motion.div>
      </motion.div>
    </section>
  );
}
