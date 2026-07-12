'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './SpinningBrandCard.module.css';

interface SpinningBrandCardProps {
  size?: number; // default 200
  className?: string;
}

export default function SpinningBrandCard({ size = 200, className = '' }: SpinningBrandCardProps) {
  // We stack layers between z=-4px and z=4px to simulate the coin edge thickness
  const edgeLayers = Array.from({ length: 9 }).map((_, i) => {
    const zOffset = i - 4; // -4 to 4
    return (
      <div 
        key={i} 
        className={styles.layer} 
        style={{ transform: `translateZ(${zOffset}px)` }} 
      />
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={`${styles.scene} ${className}`}
      style={{ '--card-size': `${size}px` } as React.CSSProperties}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      <div className={styles.coin}>
        {/* Solid Edges */}
        {edgeLayers}
        
        {/* Front Face */}
        <div className={`${styles.face} ${styles.front}`}>
          matte.
        </div>
        
        {/* Back Face */}
        <div className={`${styles.face} ${styles.back}`}>
          m.
        </div>
      </div>
    </motion.div>
  );
}
