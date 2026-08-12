'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function PhilosophySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
  };

  const text = ["Good", "Things", "Take", "Time."];

  return (
    <section className="w-full min-h-screen bg-background flex items-center justify-center py-32 px-6">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        
        <motion.div 
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex flex-wrap justify-center gap-x-6 gap-y-4 mb-16"
        >
          {text.map((word, index) => (
            <motion.h2 
              key={index}
              variants={wordVariants}
              className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold uppercase tracking-tighter text-foreground"
            >
              {word}
            </motion.h2>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
          className="text-xl md:text-2xl text-text-muted font-light max-w-2xl leading-relaxed"
        >
          Craftsmanship is not about speed. It is about intention. Every hour invested is an assurance of a lifetime of quality.
        </motion.p>
      </div>
    </section>
  );
}
