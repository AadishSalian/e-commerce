'use client';

import React from 'react';
import { motion } from 'framer-motion';

const details = [
  {
    id: 1,
    title: 'The Edge',
    description: 'Burnished and sealed to prevent fraying.',
    image: 'https://images.unsplash.com/photo-1544485559-00566ff6d25b?q=80&w=800&auto=format&fit=crop',
    className: 'col-span-1 md:col-span-2 aspect-[4/3] md:aspect-[16/9]'
  },
  {
    id: 2,
    title: 'The Stitch',
    description: 'Double lock-stitched for permanence.',
    image: 'https://images.unsplash.com/photo-1590740523293-6a97825a07aa?q=80&w=800&auto=format&fit=crop',
    className: 'col-span-1 md:col-span-1 aspect-square'
  },
  {
    id: 3,
    title: 'The Grain',
    description: 'Selected for uniform texture and strength.',
    image: 'https://images.unsplash.com/photo-1537832816519-689ad163238b?q=80&w=800&auto=format&fit=crop',
    className: 'col-span-1 md:col-span-1 aspect-square'
  },
  {
    id: 4,
    title: 'The Form',
    description: 'Molded to perfection by expert hands.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
    className: 'col-span-1 md:col-span-2 aspect-[4/3] md:aspect-[16/9]'
  }
];

export default function CraftsmanshipDetails() {
  return (
    <section className="w-full py-24 md:py-32 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 mb-16 flex justify-between items-end">
        <h2 className="text-4xl md:text-5xl font-serif font-bold uppercase tracking-tight text-foreground">
          Attention<br />
          To Detail
        </h2>
        <p className="hidden md:block text-text-muted font-light max-w-sm text-right">
          It is the combination of hundreds of microscopic decisions that creates the final experience.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {details.map((detail, index) => (
            <motion.div 
              key={detail.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
              className={`relative group overflow-hidden bg-surface ${detail.className}`}
            >
              <img 
                src={detail.image} 
                alt={detail.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              
              <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <h3 className="text-2xl font-serif font-bold text-white mb-2">{detail.title}</h3>
                <p className="text-white/80 text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
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
