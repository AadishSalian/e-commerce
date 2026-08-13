'use client';

import React from 'react';
import { motion } from 'framer-motion';

const details = [
  {
    id: 1,
    title: 'The Edge',
    description: 'Burnished and sealed to prevent fraying. No folded corners, just raw, treated edges that tell the truth of the material.',
    image: 'https://images.unsplash.com/photo-1544485559-00566ff6d25b?q=80&w=1200&auto=format&fit=crop',
    className: 'col-span-12 md:col-span-7',
    imageAspect: 'aspect-[4/3] md:aspect-[3/4]',
    textPlacement: 'bottom-0 right-0 md:translate-y-12 md:translate-x-12 bg-background p-8 border border-border w-11/12 md:w-80'
  },
  {
    id: 2,
    title: 'The Stitch',
    description: 'Double lock-stitched for permanence. We use high-tensile braided thread that refuses to yield.',
    image: 'https://images.unsplash.com/photo-1590740523293-6a97825a07aa?q=80&w=800&auto=format&fit=crop',
    className: 'col-span-12 md:col-span-4 md:col-start-9 md:mt-32',
    imageAspect: 'aspect-square',
    textPlacement: 'top-0 left-0 md:-translate-y-8 md:-translate-x-8 bg-surface p-6 w-11/12 md:w-64'
  },
  {
    id: 3,
    title: 'The Grain',
    description: 'Selected for uniform texture and strength. Every hide is inspected under harsh light to reveal its true character.',
    image: 'https://images.unsplash.com/photo-1537832816519-689ad163238b?q=80&w=800&auto=format&fit=crop',
    className: 'col-span-12 md:col-span-5 md:col-start-2 md:mt-16',
    imageAspect: 'aspect-[3/4]',
    textPlacement: 'bottom-0 left-0 md:-translate-x-16 md:translate-y-16 bg-background p-8 border-l-4 border-accent w-11/12 md:w-96'
  },
  {
    id: 4,
    title: 'The Form',
    description: 'Molded to perfection by expert hands. Tools passed down through generations are the only machinery we trust.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format&fit=crop',
    className: 'col-span-12 md:col-span-9 md:col-start-4 md:mt-24',
    imageAspect: 'aspect-video',
    textPlacement: 'bottom-0 left-0 md:translate-x-24 md:-translate-y-12 bg-surface p-10 max-w-sm'
  }
];

export default function CraftsmanshipDetails() {
  return (
    <section className="w-full py-24 md:py-40 bg-background overflow-hidden border-t border-border">
      <div className="px-6 md:px-12 mb-24 md:mb-40">
        <h2 className="text-4xl md:text-7xl font-serif font-bold uppercase tracking-tight text-foreground max-w-2xl">
          Attention<br />
          To Detail
        </h2>
        <div className="w-24 h-1 bg-foreground mt-8" />
      </div>

      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-12 gap-y-24 md:gap-y-0 md:gap-x-6">
          {details.map((detail, index) => (
            <motion.div 
              key={detail.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
              className={`relative ${detail.className}`}
            >
              <div className={`w-full overflow-hidden ${detail.imageAspect}`}>
                <img 
                  src={detail.image} 
                  alt={detail.title} 
                  className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                />
              </div>
              
              <div className={`absolute z-10 ${detail.textPlacement}`}>
                <span className="text-xs font-bold text-accent tracking-[0.3em] uppercase mb-2 block">
                  0{detail.id}
                </span>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-3 uppercase tracking-widest">{detail.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed font-light">
                  {detail.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

