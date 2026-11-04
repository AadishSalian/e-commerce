'use client';

import React from 'react';
import { StackedCards, StackedCardItem } from '@/components/ui';

const brandValues: StackedCardItem[] = [
  {
    id: 'value-quality',
    eyebrow: 'PILLAR 01 — STANDARD',
    title: 'Quality',
    badge: 'Uncompromising',
    body: 'We source only the finest materials, testing every product to ensure it outlasts seasonal trends. Quality is not an afterthought or an optional feature—it is our absolute baseline.',
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1000&auto=format&fit=crop',
    ghostNumeral: '01',
    link: { href: '/craftsmanship', label: 'View Craftsmanship' },
  },
  {
    id: 'value-simplicity',
    eyebrow: 'PILLAR 02 — ESSENCE',
    title: 'Simplicity',
    badge: 'Purposeful',
    body: 'We strip away the non-essential. Our minimalist design philosophy ensures that every detail serves a purpose, leaving you with objects that are intuitively and quietly beautiful.',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1000&auto=format&fit=crop',
    ghostNumeral: '02',
  },
  {
    id: 'value-trust',
    eyebrow: 'PILLAR 03 — INTEGRITY',
    title: 'Trust',
    badge: 'Transparency',
    body: 'From our supply chain to our pricing models, we operate with complete openness. We believe that lasting trust is earned through consistent, honest, and verifiable actions.',
    image: 'https://images.unsplash.com/photo-1555529902-5261145633bf?q=80&w=1000&auto=format&fit=crop',
    ghostNumeral: '03',
    link: { href: '/about#story', label: 'Our Story' },
  },
  {
    id: 'value-sustainability',
    eyebrow: 'PILLAR 04 — RESPONSIBILITY',
    title: 'Sustainability',
    badge: 'Longevity',
    body: 'We prioritize sustainable practices across our entire product lifecycle. By creating durable goods engineered to last decades, we reduce waste and promote mindful consumption.',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1000&auto=format&fit=crop',
    ghostNumeral: '04',
    link: { href: '/products', label: 'Browse Collection' },
  },
];

export default function ValuesTabs() {
  return (
    <StackedCards
      id="brand-values"
      eyebrow="Core Pillars"
      title="What We Stand For"
      description="The four foundational commitments that guide every design choice, material selection, and customer relationship."
      cards={brandValues}
      showProgress={true}
      showGhostNumerals={true}
    />
  );
}

export { ValuesTabs, ValuesTabs as BrandValues };
