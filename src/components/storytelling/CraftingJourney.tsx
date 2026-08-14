'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const journeySteps = [
  {
    id: '01',
    title: 'Material',
    description: 'We source only the finest raw materials, ensuring sustainability and durability from the very beginning.',
    image: 'https://images.unsplash.com/photo-1544485559-00566ff6d25b?q=80&w=1000&auto=format&fit=crop',
    duration: 1
  },
  {
    id: '02',
    title: 'Shaping',
    description: 'The initial form is meticulously cut and shaped, guided by years of intuition and precision tools.',
    image: 'https://images.unsplash.com/photo-1616781295982-f472851954ed?q=80&w=1000&auto=format&fit=crop',
    duration: 2
  },
  {
    id: '03',
    title: 'Handcraft',
    description: 'Every edge is burnished and every surface treated by hand. This is where the product gains its soul.',
    image: 'https://images.unsplash.com/photo-1590740523293-6a97825a07aa?q=80&w=1000&auto=format&fit=crop',
    duration: 5
  },
  {
    id: '04',
    title: 'Finishing',
    description: 'The detailed finishing process ensures resilience. We apply proprietary natural treatments to protect the integrity.',
    image: 'https://images.unsplash.com/photo-1537832816519-689ad163238b?q=80&w=1000&auto=format&fit=crop',
    duration: 3
  },
  {
    id: '05',
    title: 'The Final Piece',
    description: 'A masterpiece ready for a lifetime of use. It will only grow more beautiful as it ages with you.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
    duration: 0
  }
];

export default function CraftingJourney() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Map scroll progress (0 to 1) to active step index (0 to 4)
    const step = Math.min(Math.floor(latest * 5), 4);
    setActiveStep(step);
  });

  return (
    <>
      {/* Mobile Version - Standard Vertical Stack */}
      <section className="w-full bg-background py-24 md:hidden">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <h2 className="text-4xl font-serif font-bold uppercase tracking-tight text-foreground">
            From Material<br />
            To Masterpiece
          </h2>
        </div>
        <div className="flex flex-col gap-16 px-6">
          {journeySteps.map((step, index) => (
            <div key={step.id} className="flex flex-col gap-6">
              <span className="text-sm font-semibold tracking-widest text-text-muted">{step.id}</span>
              <h3 className="text-3xl font-serif font-medium text-foreground">{step.title}</h3>
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
              </div>
              <p className="text-text-muted text-lg leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Desktop Version - Horizontal Scroll */}
      <section ref={targetRef} className="relative h-[500vh] bg-background hidden md:block">
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        
        {/* Header and Progress Indicator */}
        <div className="absolute top-24 left-0 w-full px-12 md:px-24 flex items-end justify-between z-10">
          <h2 className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tight text-foreground">
            From Material<br />
            To Masterpiece
          </h2>
          
          <div className="flex flex-col items-end gap-4 w-1/3">
            <div className="text-lg font-medium text-foreground tracking-widest">
              0{activeStep + 1} <span className="text-text-muted">/ 05</span>
            </div>
            <div className="w-full h-[1px] bg-border relative">
              <motion.div 
                className="absolute top-0 left-0 h-[2px] -mt-[0.5px] bg-accent"
                style={{ width: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
              />
            </div>
          </div>
        </div>

        {/* Horizontal Scrolling Track */}
        <motion.div 
          style={{ x }}
          className="flex px-[10vw] md:px-[30vw] items-center h-full relative"
        >
          {/* Continuous Timeline Track */}
          <div className="absolute top-1/2 left-0 w-[400vw] h-[1px] bg-border -translate-y-1/2 -z-20" />
          {journeySteps.map((step, index) => {
            const isActive = index === activeStep;
            
            return (
              <div 
                key={step.id}
                className={`relative w-[80vw] md:w-[40vw] h-[60vh] flex flex-col justify-end shrink-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-40'}`}
                style={{ marginRight: `${Math.max(4, step.duration * 15)}vw` }}
              >
                {/* Ghost Numeral */}
                <div className="absolute -top-24 -left-12 md:-left-24 text-[300px] md:text-[400px] font-serif font-bold text-foreground opacity-[0.03] pointer-events-none select-none z-0 leading-none">
                  {step.id}
                </div>

                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-10">
                  <motion.div 
                    className="w-full h-4/5 overflow-hidden"
                    initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
                    animate={{ clipPath: activeStep >= index ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)" : "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <img 
                      src={step.image} 
                      alt={step.title} 
                      className={`w-full h-full object-cover transition-transform duration-1000 ${isActive ? 'scale-100' : 'scale-110'}`} 
                    />
                  </motion.div>
                </div>
                
                <div className="relative z-10 bg-background border border-border p-8 translate-y-8 max-w-lg shadow-none">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xs font-bold tracking-widest text-accent">0{index + 1} / 05</span>
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-foreground uppercase tracking-tight mb-4">{step.title}</h3>
                  <p className="text-base text-text-muted leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
        </div>
      </section>
    </>
  );
}
