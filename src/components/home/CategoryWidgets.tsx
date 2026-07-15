'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './CategoryWidgets.module.css';

const WIDGETS = [
  { label: 'Fashion / Apparel', href: '/fashion', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=200&auto=format&fit=crop' },
  { label: 'Electronics / Gadgets', href: '/products?category=electronics', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=200&auto=format&fit=crop' },
  { label: 'Home & Furniture', href: '/products?category=home', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=200&auto=format&fit=crop' },
  { label: 'Beauty & Personal Care', href: '/products?category=beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=200&auto=format&fit=crop' },
  { label: 'Sports & Outdoors', href: '/products?category=sports', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=200&auto=format&fit=crop' },
  { label: 'Accessories', href: '/products?category=accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  }
};

export default function CategoryWidgets() {
  return (
    <section className={styles.wrapper} aria-label="Quick Categories">
      <motion.div 
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {WIDGETS.map((widget, i) => (
          <motion.div key={widget.label} variants={itemVariants}>
            <Link href={widget.href} className={styles.widget}>
              <div className={styles.imageWrapper}>
                <img src={widget.image} alt={widget.label} className={styles.image} loading="lazy" />
              </div>
              <span className={styles.label}>{widget.label}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
