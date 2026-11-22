'use client';

import { Suspense, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Eye } from 'lucide-react';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { useQuickView } from '@/contexts/QuickViewContext';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LiquidShaderImage } from '@/components/ui';
import { CompareButton } from '@/components/compare';
import Image from 'next/image';
import { useScrollRestoration } from '@/lib/scroll-restoration';

const customEase = [0.65, 0, 0.35, 1] as const;

const categories = ['All Categories', 'Workspace', 'Audio', 'Wearables', 'Photography', 'Smart Home'];
const productTypes = ['All Types', 'Peripherals', 'Headphones', 'Earbuds', 'Displays', 'Cameras', 'Accessories'];
const featuresList = ['All Features', 'Wireless', 'Noise Cancelling', 'Ergonomic', 'High-Res'];

function ElectronicsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openQuickView } = useQuickView();

  const techProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => p.category === 'Tech');
  }, []);

  // Filtering State from URL
  const activeCategory = searchParams.get('category') || 'All Categories';
  const activeType = searchParams.get('type') || 'All Types';
  const activeFeature = searchParams.get('feature') || 'All Features';

  const updateFilters = (patch: { category?: string; type?: string; feature?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextCat = patch.category !== undefined ? patch.category : activeCategory;
    const nextType = patch.type !== undefined ? patch.type : activeType;
    const nextFeat = patch.feature !== undefined ? patch.feature : activeFeature;

    if (nextCat && nextCat !== 'All Categories') params.set('category', nextCat);
    else params.delete('category');

    if (nextType && nextType !== 'All Types') params.set('type', nextType);
    else params.delete('type');

    if (nextFeat && nextFeat !== 'All Features') params.set('feature', nextFeat);
    else params.delete('feature');

    const qs = params.toString();
    const targetUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(targetUrl, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    return techProducts.filter((p) => {
      const attrs = (p as any).attributes || {};
      const catMatch = activeCategory === 'All Categories' || (attrs.techCategory && attrs.techCategory.includes(activeCategory));
      const typeMatch = activeType === 'All Types' || attrs.productType === activeType;
      const featMatch = activeFeature === 'All Features' || attrs.feature === activeFeature;
      return catMatch && typeMatch && featMatch;
    });
  }, [techProducts, activeCategory, activeType, activeFeature]);

  const { gridRef, handleCardClick } = useScrollRestoration({
    listingId: 'electronics-collection',
    itemsCount: filteredProducts.length,
    isReady: true,
  });

  const monitor = techProducts.find((p) => p.id === 't-5');
  const keyboard = techProducts.find((p) => p.id === 't-1');
  const mouse = techProducts.find((p) => p.id === 't-6');

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-white font-sans overflow-x-hidden">
      {/* 1. Hero Section */}
      <section className="relative min-h-[70vh] w-full pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: customEase }}
          className="flex-1 max-w-xl z-10"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-[#8ed500] font-bold mb-4 block">
            Hardware & Acoustics
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.05]">
            Engineered<br />Silence.
          </h1>
          <p className="text-text-muted text-lg md:text-xl mb-8 leading-relaxed">
            Machined metals, acoustically tuned chambers, and tactile feedback designed to disappear into your workflow.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#collection"
              className="px-8 py-4 bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 transition-colors"
            >
              Explore Products
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: customEase }}
          className="flex-1 w-full max-w-lg aspect-square relative rounded-3xl overflow-hidden shadow-2xl border border-border"
        >
          <Image
            src="https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1200&auto=format&fit=crop"
            alt="Minimal mechanical keyboard"
            className="w-full h-full object-cover"
            width={800}
            height={800}
          />
        </motion.div>
      </section>

      {/* 2. Collection Section */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full bg-background" id="collection">
        <div className="mb-16">
          <h2 id="results-heading" className="text-3xl md:text-5xl font-bold tracking-tight mb-10 focus:outline-none">
            Shop by Category.
          </h2>

          {/* Primary Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => updateFilters({ category: cat })}
                className={`px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-foreground text-background shadow-lg scale-105'
                    : 'bg-surface text-text-muted hover:bg-surface-hover hover:text-foreground border border-border/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
            <span className="text-sm font-medium text-text-muted mr-2">Filter by:</span>

            <div className="relative min-w-[160px]">
              <CustomSelect
                value={activeType}
                onChange={(t) => updateFilters({ type: t })}
                variant="pill"
                options={productTypes.map((t) => ({ label: t, value: t }))}
              />
            </div>

            <div className="relative min-w-[180px]">
              <CustomSelect
                value={activeFeature}
                onChange={(f) => updateFilters({ feature: f })}
                variant="pill"
                options={featuresList.map((t) => ({ label: t, value: t }))}
              />
            </div>

            {(activeCategory !== 'All Categories' || activeType !== 'All Types' || activeFeature !== 'All Features') && (
              <button
                onClick={() => updateFilters({ category: 'All Categories', type: 'All Types', feature: 'All Features' })}
                className="text-sm text-text-muted hover:text-foreground underline underline-offset-4 ml-4 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-16">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                data-product-id={product.id}
                id={`product-${product.id}`}
                className="group cursor-pointer scroll-mt-28 md:scroll-mt-32"
              >
                <Link
                  href={`/products/${product.id}`}
                  onClick={() => handleCardClick(product.id)}
                  className="block focus-visible:outline-2 focus-visible:outline-[#8ed500] focus-visible:outline-offset-4 rounded-2xl"
                >
                  <div className="w-full aspect-[4/5] bg-surface overflow-hidden mb-6 relative rounded-2xl border border-border/50 group-hover:border-border transition-all duration-500">
                    {product.isNew && (
                      <span className="absolute top-4 left-4 z-20 bg-foreground text-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                        New
                      </span>
                    )}
                    <LiquidShaderImage
                      src={product.image}
                      hoverSrc={product.hoverImage}
                      alt={product.name}
                      fill
                      className="absolute inset-0 w-full h-full"
                    />

                    <div className="absolute top-3.5 right-3.5 z-20">
                      <CompareButton product={product} variant="card-corner" />
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCardClick(product.id);
                          openQuickView(product);
                        }}
                        className="bg-background/90 backdrop-blur-md text-foreground p-2.5 rounded-full hover:bg-background hover:scale-105 transition-all shadow-lg"
                        title="Quick View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <CompareButton product={product} variant="icon" />
                    </div>
                  </div>

                  <div className="flex justify-between items-start px-2">
                    <div className="flex flex-col">
                      <h3 className="text-foreground font-semibold tracking-tight text-lg mb-1">{product.name}</h3>
                      <p className="text-text-muted text-xs uppercase tracking-wider font-medium">
                        {product.variants && product.variants.length > 0 ? `${product.variants.length} Options` : '1 Option'}
                      </p>
                    </div>
                    <p className="text-foreground font-medium">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-surface/40 rounded-[2rem] border border-border border-dashed">
            <h3 className="text-2xl font-bold mb-3 text-foreground">No items found</h3>
            <p className="text-text-muted text-lg max-w-md mx-auto mb-8">
              We couldn&apos;t find any devices matching those specific filters. Try adjusting your category, type, or feature.
            </p>
            <button
              onClick={() => updateFilters({ category: 'All Categories', type: 'All Types', feature: 'All Features' })}
              className="px-8 py-4 bg-foreground text-background rounded-full font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-opacity"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* 3. Shop the Setup */}
      <section className="py-32 bg-surface/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Build your setup.</h2>
          <p className="text-text-muted text-lg mb-16 max-w-2xl mx-auto">
            Curated essentials for the ultimate workstation. Everything you need, nothing you don&apos;t.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[monitor, keyboard, mouse].map(
              (item) =>
                item && (
                  <div
                    key={item.id}
                    className="bg-surface p-6 rounded-2xl border border-border/50 hover:border-border transition-colors group flex flex-col"
                  >
                    <div className="aspect-square bg-surface rounded-xl mb-6 overflow-hidden relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                        width={800}
                        height={800}
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">{item.name}</h3>
                    <p className="text-text-muted text-sm mb-6 flex-grow">{item.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-mono text-foreground">${item.price.toFixed(2)}</span>
                      <Link
                        href={`/products/${item.id}`}
                        className="text-sm font-semibold uppercase tracking-wider text-[#8ed500] hover:text-foreground transition-colors"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ElectronicsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pt-32 text-center">Loading electronics...</div>}>
      <ElectronicsContent />
    </Suspense>
  );
}
