'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RollingText, WeightHeadline } from '@/components/ui';
import { PanelGallery } from '@/components/ui/PanelGallery';
import { HOMEPAGE_CATEGORY_PANELS } from '@/config/categories';
import { useLocale } from '@/contexts/LocaleContext';
import styles from './CategoryShowcase.module.css';

export interface CategoryShowcaseProps {
  /**
   * Display variant: 'gallery' (hover-expanding panel gallery) or 'bento' (bento grid).
   * Defaults to 'gallery'. As specified, use one or the other on a page, never both.
   */
  variant?: 'gallery' | 'bento';
  /** ID of the panel expanded by default */
  defaultActiveId?: string;
}

const BENTO_CATEGORIES = [
  {
    id: 'fashion',
    titleKey: 'fashion',
    defaultTitle: 'Fashion & Apparel',
    href: '/fashion',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
    gridClass: styles.cardFashion,
    posClass: styles.posBottomLeft,
    overlayClass: styles.overlay,
  },
  {
    id: 'electronics',
    titleKey: 'electronics',
    defaultTitle: 'Electronics',
    href: '/electronics',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardTech,
    posClass: styles.posTopLeft,
    overlayClass: styles.overlayTop,
  },
  {
    id: 'home',
    titleKey: 'home',
    defaultTitle: 'Home & Furniture',
    href: '/home-furniture',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardHome,
    posClass: styles.posBottomRight,
    overlayClass: styles.overlay,
  },
  {
    id: 'beauty',
    titleKey: 'beauty',
    defaultTitle: 'Beauty Care',
    href: '/beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardBeauty,
    posClass: styles.posCenter,
    overlayClass: styles.overlayCenter,
  },
  {
    id: 'sports',
    titleKey: 'sports',
    defaultTitle: 'Sports & Outdoors',
    href: '/sports',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardSports,
    posClass: styles.posBottomLeft,
    overlayClass: styles.overlay,
  },
  {
    id: 'accessories',
    titleKey: 'accessories',
    defaultTitle: 'Curated Accessories',
    href: '/accessories',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardAccessories,
    posClass: styles.posTopRight,
    overlayClass: styles.overlayTop,
  },
];

export default function CategoryShowcase({
  variant = 'gallery',
  defaultActiveId = 'fashion',
}: CategoryShowcaseProps) {
  const { t } = useLocale();

  // 1. Primary Showcase: Hover-Expanding Panel Gallery
  if (variant === 'gallery') {
    return (
      <PanelGallery
        panels={HOMEPAGE_CATEGORY_PANELS}
        defaultActiveId={defaultActiveId}
        title={t('home.curatedCategories') || 'Curated Categories'}
        subtitle={t('home.exploreCollections') || 'Explore Collections'}
        sectionAriaLabel={t('home.productCategories') || 'Product Categories'}
      />
    );
  }

  // 2. Alternative Variant: Bento Grid
  return (
    <section className={styles.section} aria-label={t('home.productCategories') || 'Product Categories'}>
      <div className={styles.container}>
        <div className="mb-8 md:mb-12">
          <WeightHeadline
            as="h2"
            perLetter
            align="left"
            className="text-3xl md:text-5xl font-bold tracking-tight text-foreground"
          >
            {t('home.curatedCategories') || 'Curated Categories'}
          </WeightHeadline>
        </div>
        <div className={styles.grid}>
          {BENTO_CATEGORIES.map((cat) => {
            const title = t(`categories.${cat.titleKey}`) || cat.defaultTitle;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className={`${styles.card} ${cat.gridClass} group`}
                data-roll-parent=""
                aria-label={`Shop ${title}`}
              >
                {/* Background Image */}
                <div className={styles.imageWrapper}>
                  <Image
                    src={cat.image}
                    alt=""
                    className={styles.image}
                    loading="lazy"
                    width={800}
                    height={800}
                  />
                </div>

                {/* Overlays */}
                <div className={`${styles.overlay} ${cat.overlayClass}`} />
                <div className={styles.grain} />

                {/* Typography */}
                <div className={`${styles.content} ${cat.posClass}`}>
                  <div className="flex flex-col items-start gap-1">
                    <h3 className={styles.title}>{title}</h3>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-white/80 group-hover:text-accent transition-colors mt-2">
                      <RollingText duplicateColor="var(--accent)">
                        {t('common.shopNow') || 'Shop now'}
                      </RollingText>
                      <span
                        className="text-xs transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        &rarr;
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
