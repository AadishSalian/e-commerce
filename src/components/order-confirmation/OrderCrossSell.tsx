'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TRUST_POLICIES } from '@/config/trustPolicies';
import styles from './OrderCrossSell.module.css';

const CROSS_SELL_ITEMS = [
  {
    id: 'rec-1',
    name: 'Mineral Desk Pad',
    price: 3490,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=400&auto=format&fit=crop',
    href: '/accessories',
  },
  {
    id: 'rec-2',
    name: 'Ceramic Microfiber Cloth',
    price: 890,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400&auto=format&fit=crop',
    href: '/accessories',
  },
  {
    id: 'rec-3',
    name: 'Cast Stone Cable Guide',
    price: 1490,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=400&auto=format&fit=crop',
    href: '/home-furniture',
  },
  {
    id: 'rec-4',
    name: 'Matte Travel Pouch',
    price: 2190,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop',
    href: '/accessories',
  },
];

export const OrderCrossSell: React.FC = () => {
  return (
    <section className={styles.crossSellContainer} aria-labelledby="cross-sell-heading">
      <div className={styles.headingRow}>
        <h2 id="cross-sell-heading" className={styles.sectionTitle}>
          Pairs well with your setup
        </h2>
        <span className={styles.sectionSub}>Complementary studio essentials</span>
      </div>

      <div className={styles.productsGrid}>
        {CROSS_SELL_ITEMS.map((item) => (
          <Link key={item.id} href={item.href} className={styles.productCard}>
            <div className={styles.imageBox}>
              <Image
                src={item.image}
                alt={item.name}
                width={240}
                height={240}
                className={styles.image}
                loading="lazy"
              />
            </div>
            <div className={styles.productName}>{item.name}</div>
            <div className={styles.productPrice}>₹{item.price.toLocaleString('en-IN')}</div>
          </Link>
        ))}
      </div>

      {/* Trust Policy Summary */}
      <div className={styles.policyBanner}>
        <div>
          <span>
            Hardware covered by our {TRUST_POLICIES.warranty.years}-year guarantee.{' '}
            Standard items include a {TRUST_POLICIES.returns.windowDays}-day return window.
          </span>
        </div>
        <Link href={TRUST_POLICIES.returns.url} className={styles.policyLink}>
          Review Guarantee Terms &rarr;
        </Link>
      </div>
    </section>
  );
};
