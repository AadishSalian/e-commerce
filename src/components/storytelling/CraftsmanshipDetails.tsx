'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HandwrittenAnnotation } from '../ui/HandwrittenAnnotation';

function MaskRevealImage({ children, aspect, index }: { children: React.ReactNode, aspect: string, index: number }) {
  return (
    <div className={`relative w-full ${aspect} overflow-hidden`}>
      <div className="absolute top-0 left-0 w-full h-full">
        {children}
      </div>
    </div>
  );
}

const details = [
  {
    id: 1,
    title: 'The Edge',
    description: 'Burnished and sealed to prevent fraying. No folded corners, just raw, treated edges that tell the truth of the material.',
    image: '/images/craft-4.svg',
    className: 'col-span-12 md:col-span-7',
    imageAspect: 'aspect-[4/3] md:aspect-[3/4]',
    textPlacement: 'bottom-0 right-0 md:translate-y-12 md:translate-x-12 bg-background p-8 border border-border w-11/12 md:w-80'
  },
  {
    id: 2,
    title: 'The Stitch',
    description: 'Double lock-stitched for permanence. We use high-tensile braided thread that refuses to yield.',
    image: '/images/craft-5.svg',
    className: 'col-span-12 md:col-span-4 md:col-start-9 md:mt-32',
    imageAspect: 'aspect-square',
    textPlacement: 'top-0 left-0 md:-translate-y-8 md:-translate-x-8 bg-surface p-6 w-11/12 md:w-64'
  },
  {
    id: 3,
    title: 'The Grain',
    description: 'Selected for uniform texture and strength. Every hide is inspected under harsh light to reveal its true character.',
    image: '/images/craft-1.svg',
    className: 'col-span-12 md:col-span-5 md:col-start-2 md:mt-16',
    imageAspect: 'aspect-[3/4]',
    textPlacement: 'bottom-0 left-0 md:-translate-x-16 md:translate-y-16 bg-background p-8 border-l-4 border-accent w-11/12 md:w-96'
  },
  {
    id: 4,
    title: 'The Form',
    description: 'Molded to perfection by expert hands. Tools passed down through generations are the only machinery we trust.',
    image: '/images/craft-2.svg',
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
            <div 
              key={detail.id}
              className={`relative ${detail.className}`}
            >
              <MaskRevealImage aspect={detail.imageAspect} index={index}>
                <img 
                  src={detail.image} 
                  alt={detail.title} 
                  className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                />
              </MaskRevealImage>
              
              <div className={`absolute z-10 ${detail.textPlacement}`}>
                <span className="text-xs font-bold text-accent tracking-[0.3em] uppercase mb-2 block">
                  0{detail.id}
                </span>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-3 uppercase tracking-widest">{detail.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed font-light">
                  {detail.description}
                </p>
              </div>

              {/* Hand-written annotations to break the grid */}
              {detail.id === 1 && (
                <HandwrittenAnnotation 
                  text="Notice the burnish gradient" 
                  className="top-1/4 -right-16 hidden lg:block" 
                  rotation={-8}
                  lineDirection="bottom-left" 
                />
              )}
              {detail.id === 3 && (
                <HandwrittenAnnotation 
                  text="Checked under harsh light" 
                  className="top-12 -left-12 hidden lg:block" 
                  rotation={4}
                  lineDirection="bottom-right" 
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

