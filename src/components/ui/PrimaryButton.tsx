'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import styles from './Button.module.css';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isSuccess?: boolean;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, icon, isSuccess, className = '', ...props }, ref) => {
    return (
      <button 
        ref={ref}
        className={`${styles.baseBtn} ${styles.primary} ${isSuccess ? styles.success : ''} ${className}`}
        {...props}
      >
        <span className={styles.primaryContent}>
          <AnimatePresence mode="wait" initial={false}>
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="flex items-center gap-2 font-bold"
              >
                <Check size={18} strokeWidth={3} />
                <span>Added</span>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="flex items-center gap-3"
              >
                {children}
                {icon && (
                  <span className={styles.iconCapsule}>
                    <span className={styles.primaryIcon}>{icon}</span>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </span>
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';
