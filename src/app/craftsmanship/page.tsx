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
    <div className="flex flex-col w-full min-h-screen bg-zinc-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-serif font-semibold tracking-tight text-zinc-900 mb-6">
          The Art of Making
        </h1>
        <p className="text-xl text-zinc-600 max-w-2xl">
          We believe in creating products that aren't just used, but cherished. 
          Explore the techniques and materials that set our pieces apart.
        </p>
      </section>

      {/* Storytelling Components Showcase */}
      <div className="w-full flex flex-col gap-32 pb-32">
        
        {/* Split Reveal Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-serif font-medium text-zinc-900 mb-4">Material Transformation</h2>
            <p className="text-lg text-zinc-600">See the raw, untreated leather transform into our signature supple finish through our proprietary natural tanning process.</p>
          </div>
          <SplitRevealSlider 
            beforeImage="https://images.unsplash.com/photo-1590740523293-6a97825a07aa?q=80&w=1200&auto=format&fit=crop"
            afterImage="https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?q=80&w=1200&auto=format&fit=crop"
            beforeAlt="Raw Material"
            afterAlt="Finished Leather"
          />
        </section>

        {/* Parallax Shadow Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="mb-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-serif font-medium text-zinc-900 mb-4">Featherlight Engineering</h2>
            <p className="text-lg text-zinc-600">Designed to feel almost weightless. Interact with the product below to see it float effortlessly in space, reacting to your every move.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
            <ParallaxProductShadow 
              imageUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop"
              imageAlt="Floating Sneaker"
            />
          </div>
        </section>

        {/* Animated Stitching Section */}
        <section className="w-full bg-white border-y border-zinc-200">
          <AnimatedStitching />
        </section>

      </div>
    </div>
  );
}
