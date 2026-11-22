'use client';

import { Suspense, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { CustomSelect } from '@/components/ui/CustomSelect';
import ProductCard from '@/components/product/ProductCard';
import { SplitHero } from '@/components/ui/SplitHero';
import { WOMEN_MEN_SPLIT_HERO } from '@/config/splitHero';
import { useScrollRestoration } from '@/lib/scroll-restoration';

function FashionContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortBy = searchParams.get('sort') || 'newest';

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort && newSort !== 'newest') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    const qs = params.toString();
    const nextUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => p.category === 'Fashion').sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    });
  }, [sortBy]);

  const { gridRef, handleCardClick } = useScrollRestoration({
    listingId: 'fashion-collection',
    itemsCount: filteredProducts.length,
    isReady: true,
  });

  // Editorial Section Logic
  const lookbookRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: lookbookScrollY } = useScroll({
    target: lookbookRef,
    offset: ['start end', 'end start'],
  });

  const img1Y = useTransform(lookbookScrollY, [0, 1], ['0%', '20%']);
  const img2Y = useTransform(lookbookScrollY, [0, 1], ['10%', '-20%']);
  const img3Y = useTransform(lookbookScrollY, [0, 1], ['-10%', '10%']);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full selection:bg-foreground selection:text-background transition-colors duration-300">
      {/* 1. Full-Viewport Split Hero (Women / Men with Hover Expand) */}
      <SplitHero
        halves={WOMEN_MEN_SPLIT_HERO}
        pageTitle="MATTE. Fashion & Apparel — Architectural Silhouettes"
        shopAll={{
          label: 'Shop all apparel',
          href: '#collection',
          ariaLabel: 'Scroll down to browse all fashion apparel',
        }}
      />

      {/* Infinite Scrolling Marquee */}
      <div className="w-full overflow-hidden bg-foreground text-background py-5 border-y border-border">
        <motion.div
          className="whitespace-nowrap flex gap-12 items-center text-sm md:text-base font-bold uppercase tracking-[0.2em]"
          animate={{ x: [0, -1035] }}
          transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
        >
          <span>✦ FW24 COLLECTION</span>
          <span>ELEVATED ESSENTIALS</span>
          <span>✦ MODERN TAILORING</span>
          <span>SILK & WOOL</span>
          <span>✦ THE FALL LOOKBOOK</span>
          <span>FW24 COLLECTION</span>
          <span>✦ ELEVATED ESSENTIALS</span>
        </motion.div>
      </div>

      {/* 3. Interactive Product Grid */}
      <section id="collection" className="pb-32 px-4 md:px-8 max-w-7xl mx-auto w-full scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-border pb-6">
          <h2 id="results-heading" className="text-3xl md:text-5xl font-bold tracking-tight text-foreground uppercase focus:outline-none">
            The Collection
          </h2>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 mt-6 md:mt-0 shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Sort</span>
            <CustomSelect
              value={sortBy}
              onChange={handleSortChange}
              variant="underline"
              options={[
                { label: 'Newest', value: 'newest' },
                { label: 'Price: Low to High', value: 'price-low' },
                { label: 'Price: High to Low', value: 'price-high' },
              ]}
            />
          </div>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-12 md:gap-y-16"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="editorial"
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-text-muted text-lg uppercase tracking-widest">The collection is currently empty.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function FashionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pt-32 text-center">Loading fashion...</div>}>
      <FashionContent />
    </Suspense>
  );
}
