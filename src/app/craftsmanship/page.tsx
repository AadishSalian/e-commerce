import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Craftsmanship | Shop',
  description: 'Discover the meticulous attention to detail and high-quality materials that go into every product we make.',
};

export default function CraftsmanshipPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-zinc-50">
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

      {/* Placeholder for Storytelling Components */}
      <div className="w-full flex flex-col gap-32 pb-32">
        {/* Components will go here */}
      </div>
    </div>
  );
}
