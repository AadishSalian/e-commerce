'use client';

import React from 'react';
import styles from './Button.module.css';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, icon, className = '', ...props }, ref) => {
    return (
      <button 
        ref={ref}
        className={`${styles.baseBtn} ${styles.primary} ${className}`}
        {...props}
      >
        <span className={styles.primaryContent}>
          {children}
          {icon && (
            <span className={styles.iconCapsule}>
              <span className={styles.primaryIcon}>{icon}</span>
            </span>
          )}
        </span>
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';
