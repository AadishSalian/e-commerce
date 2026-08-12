import React from 'react';
import type { Metadata } from 'next';
import SplitRevealSlider from '@/components/storytelling/SplitRevealSlider';
import ParallaxProductShadow from '@/components/storytelling/ParallaxProductShadow';
import AnimatedStitching from '@/components/storytelling/AnimatedStitching';

export const metadata: Metadata = {
  title: 'Our Craftsmanship | Shop',
  description: 'Discover the meticulous attention to detail and high-quality materials that go into every product we make.',
};

export default function CraftsmanshipPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-zinc-50 overflow-x-hidden selection:bg-zinc-900 selection:text-white">
      {/* Hero Section */}
      <section className="relative w-full py-32 md:py-48 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-100 to-zinc-50 pointer-events-none" />
        <h1 className="relative text-5xl md:text-7xl font-serif font-semibold tracking-tight text-zinc-900 mb-8 max-w-4xl">
          The Art of <span className="italic font-light">Making</span>
        </h1>
        <p className="relative text-lg md:text-xl text-zinc-600 max-w-2xl font-light leading-relaxed">
          We believe in creating products that aren't just used, but cherished. 
          Explore the techniques and materials that set our pieces apart.
        </p>
      </section>

      {/* Storytelling Components Showcase */}
      <div className="w-full flex flex-col gap-24 md:gap-40 pb-40">
        
        {/* Split Reveal Section */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4 block">Chapter 01</span>
            <h2 className="text-4xl font-serif font-medium text-zinc-900 mb-6">Material Transformation</h2>
            <p className="text-lg text-zinc-600 font-light leading-relaxed">See the raw, untreated leather transform into our signature supple finish through our proprietary natural tanning process.</p>
          </div>
          <SplitRevealSlider 
            beforeImage="https://images.unsplash.com/photo-1590740523293-6a97825a07aa?q=80&w=1200&auto=format&fit=crop"
            afterImage="https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?q=80&w=1200&auto=format&fit=crop"
            beforeAlt="Raw Material"
            afterAlt="Finished Leather"
          />
        </section>

        {/* Parallax Shadow Section */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-8">
           <div className="mb-16 text-center max-w-3xl mx-auto">
            <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4 block">Chapter 02</span>
            <h2 className="text-4xl font-serif font-medium text-zinc-900 mb-6">Featherlight Engineering</h2>
            <p className="text-lg text-zinc-600 font-light leading-relaxed">Designed to feel almost weightless. Interact with the product below to see it float effortlessly in space, reacting to your every move.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 md:p-16 shadow-sm border border-zinc-100 transition-all hover:shadow-md">
            <ParallaxProductShadow 
              imageUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop"
              imageAlt="Floating Sneaker"
            />
          </div>
        </section>

        {/* Animated Stitching Section */}
        <section className="w-full bg-white border-y border-zinc-200 mt-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-20">
            <div className="mb-12 text-center max-w-3xl mx-auto md:hidden">
              <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4 block">Chapter 03</span>
            </div>
            <AnimatedStitching />
          </div>
        </section>

      </div>
    </div>
  );
}
