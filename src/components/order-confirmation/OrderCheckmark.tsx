'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PaymentStatus } from '@/lib/order-confirmation/types';
import styles from './OrderCheckmark.module.css';

interface OrderCheckmarkProps {
  orderId: string;
  status: PaymentStatus;
}

export const OrderCheckmark: React.FC<OrderCheckmarkProps> = ({ orderId, status }) => {
  const prefersReduced = useReducedMotion();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (status === 'confirmed' || status === 'confirmed_cod' || status === 'partially_confirmed') {
      const storageKey = `matte_order_animated_${orderId}`;
      const hasPlayed = sessionStorage.getItem(storageKey);

      if (!hasPlayed && !prefersReduced) {
        setShouldAnimate(true);
        sessionStorage.setItem(storageKey, 'true');
      }
    }
  }, [orderId, status, prefersReduced]);

  // Payment pending: quiet spinning progress ring
  if (status === 'payment_pending') {
    return (
      <div className={styles.container} aria-hidden="true">
        <div className={styles.pendingRing} />
      </div>
    );
  }

  // Payment failed: quiet warning indicator
  if (status === 'payment_failed') {
    return (
      <div className={styles.container} aria-hidden="true">
        <svg
          className={styles.alertIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    );
  }

  // Static rendering for reduced motion or repeat visits
  if (!shouldAnimate) {
    return (
      <div className={styles.container} aria-hidden="true">
        <svg className={styles.svg} viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="23" className={styles.circlePath} />
          <path d="M16 26.5 L23 33.5 L36 19" className={styles.checkPath} />
        </svg>
      </div>
    );
  }

  // Calm animated checkmark using Framer Motion pathLength and subtle settle
  return (
    <motion.div
      className={styles.container}
      aria-hidden="true"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], times: [0, 0.6, 1] }}
    >
      <svg className={styles.svg} viewBox="0 0 52 52">
        {/* Outer Circle draws over ~500ms */}
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          className={styles.circlePath}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Inner Checkmark draws over ~350ms, starting after circle starts */}
        <motion.path
          d="M16 26.5 L23 33.5 L36 19"
          className={styles.checkPath}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.div>
  );
};
