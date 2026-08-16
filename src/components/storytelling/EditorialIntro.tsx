'use client';

import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { AnimatedCounter } from '../ui/AnimatedCounter';

// Helper for scroll-tied image wipe
function ScrollMaskReveal({ children, className }: { children: React.ReactNode, className?: string }) {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "center center"]
  });
  const clipPath = useTransform(scrollYProgress, [0, 1], ["polygon(0 0, 100% 0, 100% 0, 0 0)", "polygon(0 0, 100% 0, 100% 100%, 0 100%)"]);
  return (
    <motion.div ref={ref} style={{ clipPath }} className={className}>
      {children}
    </motion.div>
  );
}

// Helper for word-split stagger text
function StaggeredText({ text, className }: { text: string, className?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const words = text.split(" ");
  
  return (
    <h2 ref={ref} className={`${className} flex flex-wrap gap-x-4`}>
      {words.map((word, index) => (
        <span key={index} className="overflow-hidden inline-block leading-[0.85] pb-2">
          <motion.span
            initial={{ y: "100%" }}
            animate={isInView ? { y: 0 } : { y: "100%" }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  return (
    <div className="w-full bg-background text-foreground py-24 md:py-32 flex flex-col gap-32 overflow-hidden">
      
      {/* SECTION 2 - THE ART OF TAKING TIME */}
      <section ref={artRef} className="w-full grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center">
        {/* Left: Large craftsmanship image, full bleed left */}
        <ScrollMaskReveal className="relative aspect-[4/3] md:aspect-[4/5] w-full overflow-hidden md:col-span-6 lg:col-span-5">
          <img 
            src="https://images.unsplash.com/photo-1616781295982-f472851954ed?q=80&w=1000&auto=format&fit=crop" 
            alt="Artisan working" 
            className="w-full h-full object-cover"
          />
        </ScrollMaskReveal>

        {/* Right: Typography and copy */}
        <motion.div 
          className="flex flex-col relative px-6 md:px-0 md:col-span-5 md:col-start-8"
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

          <div className="max-w-[280px] md:ml-16">
            <StaggeredText 
              text="The Art Of Taking Time." 
              className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tighter mb-12"
            />

            <motion.p 
              variants={itemVariants}
              className="text-sm md:text-base text-text-muted font-light leading-relaxed"
            >
              Every piece begins with raw material, skilled hands, and a process that refuses to be rushed. Patience is woven into the very fabric of our ethos.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* SECTION 3 - THE HANDS BEHIND THE CRAFT */}
      <section ref={handsRef} className="w-full grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center mt-12 md:mt-32">
        {/* Left: Typography and Stats */}
        <motion.div 
          className="flex flex-col order-2 md:order-1 relative px-6 md:px-0 md:col-span-5 md:col-start-2 lg:col-start-3"
          variants={containerVariants}
          initial="hidden"
          animate={handsInView ? "visible" : "hidden"}
        >
          <div className="max-w-[320px]">
            <StaggeredText 
              text="The Hands Behind The Craft"
              className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tighter mb-8"
            />

            <motion.p 
              variants={itemVariants}
              className="text-sm md:text-base text-text-muted font-light leading-relaxed mb-12"
            >
              Meet the people who transform carefully selected materials into something meaningful. True mastery cannot be automated.
            </motion.p>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-x-12 gap-y-8 border-t border-border pt-8">
              <div className="flex flex-col">
                <span className="text-4xl font-serif font-bold text-foreground mb-1 flex items-baseline">
                  <AnimatedCounter value={25} />+
                </span>
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Years of experience</span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-4xl font-serif font-bold text-foreground mb-1 flex items-baseline">
                  <AnimatedCounter value={1200} />+
                </span>
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Pieces crafted</span>
              </div>
              
              <div className="flex flex-col mt-4">
                <span className="text-4xl font-serif font-bold text-foreground mb-1 flex items-baseline">
                  <AnimatedCounter value={100} />%
                </span>
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Hand finished</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right: Artisan Image, full bleed right */}
        <ScrollMaskReveal className="relative aspect-[4/3] md:aspect-[3/4] w-full overflow-hidden order-1 md:order-2 md:col-span-5 md:col-start-8">
           <img 
            src="https://images.unsplash.com/photo-1544485559-00566ff6d25b?q=80&w=1000&auto=format&fit=crop" 
            alt="Portrait of an artisan" 
            className="w-full h-full object-cover"
          />
        </ScrollMaskReveal>
      </section>

    </div>
  );
}
