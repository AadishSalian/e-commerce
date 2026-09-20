'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import styles from './Button.module.css';
import promoStyles from './PromoButton.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'promo' | 'outline' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  isSuccess?: boolean;
  promoTextTop?: string;
  promoTextBottom?: string;
  targetDate?: Date;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 
      children, 
      variant = 'primary', 
      icon, 
      isSuccess, 
      promoTextTop = 'Limited Time', 
      promoTextBottom = 'Special Offer', 
      targetDate,
      className = '', 
      ...props 
    }, 
    ref
  ) => {
    const [timeLeft, setTimeLeft] = React.useState<string>('');

    React.useEffect(() => {
      if (!targetDate || variant !== 'promo') return;

      const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
          setTimeLeft('EXPIRED');
          return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft(`...${hours}h ${minutes}m ${seconds}s`);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }, [targetDate, variant]);
    
    if (variant === 'promo') {
      const displayBottomText = targetDate ? timeLeft : promoTextBottom;
      return (
        <div className={`${promoStyles['btn-container']} ${className}`}>
          <div className={`${promoStyles['btn-drawer']} ${promoStyles['transition-top']}`}>
            {promoTextTop}
          </div>
          <button ref={ref} className={promoStyles.btn} {...props}>
            <span className={promoStyles['btn-text']}>{children}</span>
          </button>
          <div className={`${promoStyles['btn-drawer']} ${promoStyles['transition-bottom']}`}>
            {displayBottomText}
          </div>
        </div>
      );
    }

    const isSecondary = variant === 'secondary';
    
    return (
      <button 
        ref={ref}
        className={`${styles.baseBtn} ${isSecondary ? styles.secondary : styles.primary} ${isSuccess ? styles.success : ''} ${className}`}
        {...props}
      >
        <span className={isSecondary ? styles.secondaryText : styles.primaryContent}>
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
                {icon && !isSecondary && (
                  <span className={styles.iconCapsule}>
                    <span className={styles.primaryIcon}>{icon}</span>
                  </span>
                )}
                {icon && isSecondary && (
                  <span className={styles.secondaryIcon}>{icon}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
