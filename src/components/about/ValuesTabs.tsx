'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const valuesData = [
  { 
    title: 'Quality', 
    shortDesc: 'Uncompromising standards.',
    longDesc: 'We source only the finest materials, testing every product to ensure it outlasts the trends. Quality is not a feature, it is our baseline.',
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    title: 'Simplicity', 
    shortDesc: 'Less, but better.',
    longDesc: 'We strip away the non-essential. Our minimalist design philosophy ensures that every detail serves a purpose, leaving you with objects that are intuitively beautiful.',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    title: 'Trust', 
    shortDesc: 'Transparency in everything.',
    longDesc: 'From our supply chain to our pricing models, we operate with complete openness. We believe that trust is earned through consistent, honest actions.',
    image: 'https://images.unsplash.com/photo-1555529902-5261145633bf?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    title: 'Sustainability', 
    shortDesc: 'For a better tomorrow.',
    longDesc: 'We prioritize sustainable practices across our entire product lifecycle. By creating durable goods, we reduce waste and promote a culture of mindful consumption.',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1000&auto=format&fit=crop'
  }
];

export default function ValuesTabs() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col md:flex-row gap-12 md:gap-16 min-h-[450px]">
      {/* Left Column - Tabs */}
      <div className="w-full md:w-5/12 flex flex-col justify-center gap-6 relative z-10">
        {valuesData.map((val, i) => {
          const isActive = activeIndex === i;
          return (
            <div 
              key={i} 
              className={`cursor-pointer group py-4 transition-all duration-300 ${isActive ? 'opacity-100 pl-6 border-l-2 border-accent' : 'opacity-40 hover:opacity-70 border-l-2 border-transparent pl-2'}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
            >
              <h3 className={`text-4xl md:text-5xl font-bold tracking-tight mb-2 transition-transform duration-500 ${isActive ? 'translate-x-2' : 'group-hover:translate-x-1'}`}>
                {val.title}
              </h3>
              <p className="text-xl text-text-muted">{val.shortDesc}</p>
            </div>
          );
        })}
      </div>

      {/* Right Column - Content Reveal */}
      <div className="w-full md:w-7/12 relative h-[350px] md:h-auto rounded-3xl overflow-hidden border border-border bg-surface shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(5px)' }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="relative h-full w-full">
              <img 
                src={valuesData[activeIndex].image} 
                alt={valuesData[activeIndex].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col justify-end">
                <p className="text-lg md:text-xl text-foreground leading-relaxed font-medium drop-shadow-md">
                  {valuesData[activeIndex].longDesc}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
