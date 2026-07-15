'use client';

import React from 'react';
import Link from 'next/link';
import styles from './CategoryShowcase.module.css';

const CATEGORIES = [
  {
    id: 'fashion',
    title: 'Fashion & Apparel',
    href: '/fashion',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
    gridClass: styles.cardFashion,
    posClass: styles.posBottomLeft,
    overlayClass: styles.overlay
  },
  {
    id: 'electronics',
    title: 'Electronics',
    href: '/products?category=electronics',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardTech,
    posClass: styles.posTopLeft,
    overlayClass: styles.overlayTop
  },
  {
    id: 'home',
    title: 'Home & Furniture',
    href: '/products?category=home',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardHome,
    posClass: styles.posBottomRight,
    overlayClass: styles.overlay
  },
  {
    id: 'beauty',
    title: 'Beauty Care',
    href: '/products?category=beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardBeauty,
    posClass: styles.posCenter,
    overlayClass: styles.overlayCenter
  },
  {
    id: 'sports',
    title: 'Sports & Outdoors',
    href: '/products?category=sports',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop',
    gridClass: styles.cardSports,
    posClass: styles.posTopRight,
    overlayClass: styles.overlayTop
  },
  {
    id: 'accessories',
    title: 'Accessories',
    href: '/products?category=accessories',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop',
    gridClass: styles.cardAccessories,
    posClass: styles.posBottomLeft,
    overlayClass: styles.overlay
  }
];

export default function CategoryShowcase() {
  return (
    <section className={styles.section} aria-label="Product Categories">
      <div className={styles.container}>
        <div className={styles.grid}>
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              href={cat.href}
              className={`${styles.card} ${cat.gridClass}`}
              aria-label={`Shop ${cat.title}`}
            >
              {/* Background Image */}
              <div className={styles.imageWrapper}>
                <img 
                  src={cat.image} 
                  alt="" 
                  className={styles.image}
                  loading="lazy"
                />
              </div>

              {/* Overlays */}
              <div className={`${styles.overlay} ${cat.overlayClass}`}></div>
              <div className={styles.grain}></div>

              {/* Typography */}
              <div className={`${styles.content} ${cat.posClass}`}>
                <h3 className={styles.title}>{cat.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
