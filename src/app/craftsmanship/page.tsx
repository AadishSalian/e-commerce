import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

// Storytelling Components
import CinematicHero from '@/components/storytelling/CinematicHero';
import EditorialIntro from '@/components/storytelling/EditorialIntro';
import CraftingJourney from '@/components/storytelling/CraftingJourney';
import InteractiveHotspots from '@/components/storytelling/InteractiveHotspots';
import MaterialShowcase from '@/components/storytelling/MaterialShowcase';
import PhilosophySection from '@/components/storytelling/PhilosophySection';
import SplitRevealSlider from '@/components/storytelling/SplitRevealSlider';
import CraftsmanshipDetails from '@/components/storytelling/CraftsmanshipDetails';

// UI Components
import ProductCard from '@/components/product/ProductCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export const metadata: Metadata = {
  title: 'Our Craftsmanship | Shop',
  description: 'From material to masterpiece. Explore the meticulous attention to detail and high-quality materials that go into every product we make.',
};

export default function CraftsmanshipPage() {
  // Grab a few products for the recommendation section
  const recommendedProducts = MOCK_PRODUCTS.slice(28, 32); // Using some fashion/accessories products as placeholders

  return (
    <div className="flex flex-col w-full min-h-screen bg-background overflow-x-hidden selection:bg-accent selection:text-background">
      
      {/* SECTION 1 — CINEMATIC HERO */}
      <CinematicHero />

      {/* SECTION 2 & 3 — INTRODUCTION & HANDS BEHIND THE CRAFT */}
      <EditorialIntro />

      {/* SECTION 4 — THE CRAFTING JOURNEY */}
      <CraftingJourney />

      {/* SECTION 5 — EVERY MARK HAS A STORY */}
      <div className="w-full bg-surface" style={{ clipPath: 'polygon(0 5vw, 100% 0, 100% 100%, 0 calc(100% - 5vw))', marginTop: '-5vw', paddingBottom: '5vw' }}>
        <div className="pt-[10vw]">
          <InteractiveHotspots />
        </div>
      </div>

      {/* SECTION 6 — MATERIAL SHOWCASE */}
      <div className="w-full bg-background relative z-10" style={{ clipPath: 'polygon(0 0, 100% 5vw, 100% 100%, 0 100%)', marginTop: '-5vw' }}>
        <div className="pt-[10vw]">
          <MaterialShowcase />
        </div>
      </div>

      {/* SECTION 7 — FULL-SCREEN PHILOSOPHY */}
      <div className="w-full relative z-20" style={{ clipPath: 'polygon(0 5vw, 100% 0, 100% 100%, 0 100%)', marginTop: '-5vw' }}>
        <PhilosophySection />
      </div>

      {/* SECTION 8 — RAW TO REFINED */}
      <section className="w-full py-24 md:py-32 bg-surface relative z-30" style={{ clipPath: 'polygon(0 0, 100% 5vw, 100% 100%, 0 100%)', marginTop: '-5vw', paddingTop: '10vw' }}>
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold uppercase tracking-tight text-foreground mb-4">
            From Raw<br />
            To Refined
          </h2>
          <p className="text-lg text-text-muted font-light max-w-2xl mx-auto">
            Drag the slider to see the transformation of raw material into finished product.
          </p>
        </div>
        
        <div className="px-6">
          <SplitRevealSlider 
            beforeImage="/images/craft-final.jpg"
            afterImage="/images/craft-hero.jpg"
            beforeAlt="Raw Material"
            afterAlt="Finished Product"
          />
        </div>
      </section>

      {/* SECTION 9 — CRAFTSMANSHIP DETAILS */}
      <CraftsmanshipDetails />

      {/* SECTION 10 — FINAL PRODUCT REVEAL */}
      <section className="w-full py-24 md:py-32 bg-background flex flex-col items-center justify-center text-center px-6 relative z-40" style={{ clipPath: 'polygon(0 5vw, 100% 0, 100% 100%, 0 100%)', marginTop: '-5vw', paddingTop: '10vw' }}>
        <span className="text-sm font-semibold tracking-widest text-text-muted uppercase mb-4 block">The Result</span>
        
        <div className="w-full max-w-4xl aspect-[21/9] bg-surface rounded-2xl overflow-hidden mb-12 shadow-2xl">
           <img 
              src="/images/craft-tools.jpg" 
              alt="The final product" 
              className="w-full h-full object-cover"
            />
        </div>

        <h2 className="text-5xl md:text-7xl font-serif font-bold uppercase tracking-tight text-foreground leading-[0.9] mb-12">
          Made To Be Used.<br />
          Made To Be Kept.
        </h2>

        <Link href="/products">
          <PrimaryButton className="text-base px-8 py-4 uppercase tracking-widest font-bold">
            Explore The Collection
          </PrimaryButton>
        </Link>
      </section>

      {/* SECTION 11 — PRODUCT RECOMMENDATION */}
      <section className="w-full py-24 bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-serif font-bold uppercase tracking-tight text-foreground mb-12">
            Explore The Collection
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
