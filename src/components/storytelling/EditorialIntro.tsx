'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export default function EditorialIntro() {
  const artRef = useRef(null);
  const handsRef = useRef(null);
  const artInView = useInView(artRef, { once: true, margin: "-100px" });
  const handsInView = useInView(handsRef, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="w-full bg-background text-foreground py-24 md:py-32 flex flex-col gap-32 overflow-hidden">
      
      {/* SECTION 2 - THE ART OF TAKING TIME */}
      <section ref={artRef} className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left: Large craftsmanship image */}
        <motion.div 
          className="relative aspect-[3/4] w-full overflow-hidden"
          initial={{ opacity: 0, x: -40 }}
          animate={artInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <img 
            src="https://images.unsplash.com/photo-1616781295982-f472851954ed?q=80&w=1000&auto=format&fit=crop" 
            alt="Artisan working" 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Right: Typography and copy */}
        <motion.div 
          className="flex flex-col relative pl-0 md:pl-12"
          variants={containerVariants}
          initial="hidden"
          animate={artInView ? "visible" : "hidden"}
        >
          {/* Vertical accent line */}
          <motion.div 
            className="hidden md:block absolute left-0 top-0 w-[1px] h-full bg-accent origin-top"
            initial={{ scaleY: 0 }}
            animate={artInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          <motion.h2 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-serif font-bold uppercase leading-none tracking-tight mb-8"
          >
            The Art Of<br />
            Taking<br />
            Time.
          </motion.h2>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-text-muted font-light max-w-md leading-relaxed"
          >
            Every piece begins with raw material, skilled hands, and a process that refuses to be rushed.
          </motion.p>
        </motion.div>
      </section>

      {/* SECTION 3 - THE HANDS BEHIND THE CRAFT */}
      <section ref={handsRef} className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left: Typography and Stats */}
        <motion.div 
          className="flex flex-col order-2 md:order-1 pr-0 md:pr-12 relative"
          variants={containerVariants}
          initial="hidden"
          animate={handsInView ? "visible" : "hidden"}
        >
          <motion.h2 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-serif font-bold uppercase leading-none tracking-tight mb-8"
          >
            The Hands<br />
            Behind<br />
            The Craft
          </motion.h2>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-text-muted font-light max-w-md leading-relaxed mb-12"
          >
            Meet the people who transform carefully selected materials into something meaningful.
          </motion.p>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-8 border-t border-border pt-8">
            <div className="flex flex-col">
              <span className="text-4xl font-serif font-bold text-foreground mb-2 flex items-baseline">
                <AnimatedCounter value={25} />+
              </span>
              <span className="text-sm uppercase tracking-widest text-text-muted font-medium">Years of experience</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-4xl font-serif font-bold text-foreground mb-2 flex items-baseline">
                <AnimatedCounter value={1200} />+
              </span>
              <span className="text-sm uppercase tracking-widest text-text-muted font-medium">Pieces crafted</span>
            </div>
            
            <div className="flex flex-col mt-4">
              <span className="text-4xl font-serif font-bold text-foreground mb-2 flex items-baseline">
                <AnimatedCounter value={100} />%
              </span>
              <span className="text-sm uppercase tracking-widest text-text-muted font-medium">Hand finished</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Artisan Image */}
        <motion.div 
          className="relative aspect-square md:aspect-[4/5] w-full overflow-hidden order-1 md:order-2"
          initial={{ opacity: 0, x: 40 }}
          animate={handsInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
           <img 
            src="https://images.unsplash.com/photo-1544485559-00566ff6d25b?q=80&w=1000&auto=format&fit=crop" 
            alt="Portrait of an artisan" 
            className="w-full h-full object-cover"
          />
          {/* Vertical progress line */}
          <motion.div 
            className="absolute right-0 top-0 w-1 h-full bg-accent origin-top"
            initial={{ scaleY: 0 }}
            animate={handsInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
          />
        </motion.div>
      </section>

    </div>
  );
}
