'use client';

import React, { useState, useEffect } from 'react';
import './PromoButton.css';

interface PromoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  topText: string;
  bottomText?: string;
  targetDate?: Date; // If provided, countdown replaces bottomText
}

export const PromoButton = React.forwardRef<HTMLButtonElement, PromoButtonProps>(
  ({ label, topText, bottomText, targetDate, className = '', ...props }, ref) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
      if (!targetDate) return;

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
    }, [targetDate]);

    const displayBottomText = targetDate ? timeLeft : bottomText;

    return (
      <div className={`btn-container ${className}`}>
        <div className="btn-drawer transition-top">{topText}</div>
        <div className="btn-drawer transition-bottom" aria-live="polite">
          {displayBottomText}
        </div>

        <button className="btn" ref={ref} {...props}>
          <span className="btn-text">{label}</span>
        </button>

        <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
          <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
        </svg>
        <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
          <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
        </svg>
        <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
          <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
        </svg>
        <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
          <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
        </svg>
      </div>
    );
  }
);

PromoButton.displayName = 'PromoButton';
