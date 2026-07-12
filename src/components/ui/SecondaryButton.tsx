'use client';

import React from 'react';
import styles from './Button.module.css';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SecondaryButton = React.forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <button 
        ref={ref}
        className={`${styles.baseBtn} ${styles.secondary} ${className}`}
        {...props}
      >
        <span className={styles.secondaryText}>
          {children}
        </span>
      </button>
    );
  }
);

SecondaryButton.displayName = 'SecondaryButton';
