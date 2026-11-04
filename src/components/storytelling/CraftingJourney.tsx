'use client';

import React from 'react';
import { StackedCards, StackedCardItem } from '@/components/ui';

const craftingSteps: StackedCardItem[] = [
  {
    id: 'craft-step-01',
    eyebrow: 'PHASE 01 — SOURCING',
    title: 'Material',
    badge: 'Origins',
    body: 'We source only the finest raw materials, ensuring sustainability and durability from the very beginning. Every grain and texture is personally inspected.',
    image: '/images/craft-final.jpg',
    ghostNumeral: '01',
    link: { href: '/products?category=new', label: 'Explore Materials' },
  },
  {
    id: 'craft-step-02',
    eyebrow: 'PHASE 02 — ARCHITECTURE',
    title: 'Shaping',
    badge: 'Precision',
    body: 'The initial form is meticulously cut and shaped, guided by years of intuition and precision tools. Geometry calibrated down to the millimeter.',
    image: '/images/craft-hero.jpg',
    ghostNumeral: '02',
  },
  {
    id: 'craft-step-03',
    eyebrow: 'PHASE 03 — MASTERY',
    title: 'Handcraft',
    badge: 'Artisan',
    body: 'Every edge is burnished and every surface treated by hand. This is where tactile precision meets human touch, giving each object its soul.',
    image: '/images/craft-tools.jpg',
    ghostNumeral: '03',
  },
  {
    id: 'craft-step-04',
    eyebrow: 'PHASE 04 — INTEGRITY',
    title: 'Finishing',
    badge: 'Finishing',
    body: 'The detailed finishing process ensures resilience. We apply proprietary natural treatments to protect the surface while preserving natural breathability.',
    image: '/images/craft-stitch.jpg',
    ghostNumeral: '04',
  },
  {
    id: 'craft-step-05',
    eyebrow: 'PHASE 05 — LEGACY',
    title: 'The Final Piece',
    badge: 'Masterpiece',
    body: 'A quiet masterpiece ready for a lifetime of daily use. Designed to age gracefully, gathering character and patina alongside you.',
    image: '/images/craft-final.jpg',
    ghostNumeral: '05',
    link: { href: '/products', label: 'Shop The Collection' },
  },
];

export default function CraftingJourney() {
  return (
    <StackedCards
      id="crafting-journey"
      eyebrow="The Crafting Journey"
      title="From Material To Masterpiece"
      description="Follow the five deliberate phases that transform raw, unyielding substance into timeless, engineered hardware."
      cards={craftingSteps}
      showProgress={true}
      showGhostNumerals={true}
    />
  );
}
