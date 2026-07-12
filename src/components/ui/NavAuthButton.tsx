'use client';

import React from 'react';
import styles from './NavAuthButton.module.css';

interface NavAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const NavAuthButton = React.forwardRef<HTMLButtonElement, NavAuthButtonProps>(
  ({ label = 'Sign In', className = '', ...props }, ref) => {
    return (
      <button ref={ref} className={`${styles.btn12} ${className}`} {...props}>
        <span>{label}</span>
      </button>
    );
  }
);

NavAuthButton.displayName = 'NavAuthButton';
