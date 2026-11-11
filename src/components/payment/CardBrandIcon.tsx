'use client';

import React from 'react';
import { ExtendedCardBrandId } from '@/lib/payment/types';

interface CardBrandIconProps {
  brand: ExtendedCardBrandId;
  className?: string;
  size?: number; // default height in px
  'aria-hidden'?: boolean | 'true' | 'false';
  alt?: string;
}

/**
 * Official Brand Logos rendered as optimized inline SVGs.
 * Designed to fit standard fixed height (20–24px) with fixed aspect ratio to eliminate layout jitter.
 */
export function CardBrandIcon({
  brand,
  className = '',
  size = 24,
  'aria-hidden': ariaHidden,
  alt,
}: CardBrandIconProps) {
  const width = Math.round(size * 1.5); // standard 36x24 ratio (1.5:1)
  const isHidden = ariaHidden === true || ariaHidden === 'true';

  switch (brand) {
    case 'visa':
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'Visa'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="36" height="24" rx="4" fill="#1434CB" />
          <path
            d="M14.28 17.06L16.48 7.02H19.2L17 17.06H14.28ZM23.36 7.24C22.78 7.02 21.88 6.84 20.78 6.84C18.06 6.84 16.14 8.28 16.12 10.34C16.1 11.86 17.48 12.72 18.52 13.22C19.58 13.74 19.94 14.08 19.94 14.54C19.94 15.24 19.1 15.56 18.3 15.56C17.26 15.56 16.66 15.4 15.82 15.02L15.44 14.84L15.04 17.32C15.72 17.62 16.96 17.88 18.24 17.9C21.1 17.9 22.98 16.5 23 14.32C23.02 13.1 22.22 12.16 20.74 11.44C19.84 10.98 19.3 10.68 19.3 10.18C19.3 9.74 19.8 9.28 20.84 9.28C21.72 9.28 22.38 9.48 22.86 9.68L23.1 9.8L23.36 7.24ZM29.86 7.02H27.76C27.12 7.02 26.62 7.2 26.34 7.88L22.5 17.06H25.44L26.02 15.44H29.62L29.96 17.06H32.54L29.86 7.02ZM26.84 13.18L28.32 9.14L29.18 13.18H26.84ZM12.28 7.02L9.62 13.88L9.34 12.44C8.84 10.74 7.32 8.88 5.6 7.96L8.08 17.04H11.04L15.44 7.02H12.28Z"
            fill="#FFFFFF"
          />
          <path
            d="M7.74 7.02H3.54L3.5 7.22C6.76 8.04 9.24 10.12 10.14 12.46L9.26 7.94C9.1 7.28 8.6 7.02 7.74 7.02Z"
            fill="#F7B600"
          />
        </svg>
      );

    case 'mastercard':
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'Mastercard'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="36" height="24" rx="4" fill="#1E1E1E" />
          <circle cx="13.5" cy="12" r="7.5" fill="#EB001B" />
          <circle cx="22.5" cy="12" r="7.5" fill="#F79E1B" fillOpacity="0.95" />
          <path
            d="M18 6.84C19.5 8.24 20.46 10.02 20.46 12C20.46 13.98 19.5 15.76 18 17.16C16.5 15.76 15.54 13.98 15.54 12C15.54 10.02 16.5 8.24 18 6.84Z"
            fill="#FF5F00"
          />
        </svg>
      );

    case 'amex':
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'American Express'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="36" height="24" rx="4" fill="#006FCF" />
          <path
            d="M5 16.5L8.5 7.5H12L15.5 16.5H12.8L12.1 14.5H8.4L7.7 16.5H5ZM9.1 12.6H11.4L10.25 9.4L9.1 12.6ZM16 16.5V7.5H19L21.5 12.5L24 7.5H27V16.5H24.5V11L22.3 15.5H20.7L18.5 11V16.5H16ZM28 16.5V7.5H34V9.6H30.5V11H33.5V13H30.5V14.4H34V16.5H28Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'rupay':
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'RuPay'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="36" height="24" rx="4" fill="#0F1826" />
          {/* RuPay Chevrons */}
          <path
            d="M26.2 6.5L28.8 12L26.2 17.5H23.5L26.1 12L23.5 6.5H26.2Z"
            fill="#00A859"
          />
          <path
            d="M29.5 6.5L32.1 12L29.5 17.5H26.8L29.4 12L26.8 6.5H29.5Z"
            fill="#F26522"
          />
          {/* RuPay Logotype */}
          <text
            x="4"
            y="15.5"
            fill="#FFFFFF"
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.3"
          >
            RuPay
          </text>
        </svg>
      );

    case 'discover':
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'Discover'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="36" height="24" rx="4" fill="#231F20" />
          <path
            d="M4.5 15.5V8.5H7.2C9.5 8.5 10.8 9.8 10.8 12C10.8 14.2 9.5 15.5 7.2 15.5H4.5ZM6.5 13.7H7.1C8.2 13.7 8.9 13 8.9 12C8.9 11 8.2 10.3 7.1 10.3H6.5V13.7ZM12 15.5V8.5H13.8V15.5H12ZM15 14.2L16 13.2C16.8 14 17.7 14.3 18.5 14.3C19.2 14.3 19.6 14 19.6 13.5C19.6 12.5 16.5 12.8 16.5 10.4C16.5 9.2 17.5 8.4 18.9 8.4C19.9 8.4 20.8 8.8 21.5 9.4L20.5 10.5C19.9 10 19.3 9.7 18.7 9.7C18.2 9.7 17.9 10 17.9 10.3C17.9 11.2 21 10.8 21 13.3C21 14.6 19.9 15.6 18.3 15.6C17.1 15.6 15.9 15.1 15 14.2Z"
            fill="#FFFFFF"
          />
          {/* Orange Central Disc */}
          <circle cx="24.2" cy="12" r="3.4" fill="#FF6000" />
          <path
            d="M28.5 8.5L30.2 13.6L31.9 8.5H33.8L31.2 15.5H29.2L26.6 8.5H28.5Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'diners':
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'Diners Club'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="36" height="24" rx="4" fill="#004A97" />
          {/* Diners Club Split Circle Emblem */}
          <circle cx="18" cy="12" r="7.5" fill="#FFFFFF" fillOpacity="0.2" />
          <path
            d="M17.5 6.5C14.5 6.5 12 9 12 12C12 15 14.5 17.5 17.5 17.5V6.5Z"
            fill="#FFFFFF"
          />
          <path
            d="M18.5 17.5C21.5 17.5 24 15 24 12C24 9 21.5 6.5 18.5 6.5V17.5Z"
            fill="#FFFFFF"
            fillOpacity="0.9"
          />
          <path
            d="M16 12C16 10.9 16.9 10 18 10C19.1 10 20 10.9 20 12C20 13.1 19.1 14 18 14C16.9 14 16 13.1 16 12Z"
            fill="#004A97"
          />
        </svg>
      );

    case 'jcb':
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'JCB'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="36" height="24" rx="4" fill="#FFFFFF" />
          {/* JCB 3 Rounded Pillars */}
          {/* Blue J */}
          <rect x="5" y="4" width="8" height="16" rx="2" fill="#003780" />
          <text
            x="9"
            y="15.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontWeight="bold"
            fontSize="9"
            fontFamily="system-ui, sans-serif"
          >
            J
          </text>
          {/* Red C */}
          <rect x="14" y="4" width="8" height="16" rx="2" fill="#D9001B" />
          <text
            x="18"
            y="15.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontWeight="bold"
            fontSize="9"
            fontFamily="system-ui, sans-serif"
          >
            C
          </text>
          {/* Green B */}
          <rect x="23" y="4" width="8" height="16" rx="2" fill="#008037" />
          <text
            x="27"
            y="15.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontWeight="bold"
            fontSize="9"
            fontFamily="system-ui, sans-serif"
          >
            B
          </text>
        </svg>
      );

    case 'unionpay':
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'UnionPay'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="36" height="24" rx="4" fill="#1C2028" />
          {/* Three leaning blocks (Red, Blue, Green) */}
          <path
            d="M9 5.5H16L13.5 18.5H6.5L9 5.5Z"
            fill="#C91426"
          />
          <path
            d="M15 5.5H22L19.5 18.5H12.5L15 5.5Z"
            fill="#0F4275"
          />
          <path
            d="M21 5.5H28L25.5 18.5H18.5L21 5.5Z"
            fill="#006C54"
          />
          <text
            x="17"
            y="14"
            fill="#FFFFFF"
            fontSize="5.5"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            银联
          </text>
        </svg>
      );

    case 'unknown':
    default:
      return (
        <svg
          viewBox="0 0 36 24"
          width={width}
          height={size}
          className={`shrink-0 opacity-40 hover:opacity-70 transition-opacity ${className}`}
          role={isHidden ? 'presentation' : 'img'}
          aria-label={isHidden ? undefined : alt || 'Generic Card'}
          aria-hidden={isHidden ? 'true' : undefined}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2"
            y="3"
            width="32"
            height="18"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Subtle Magnetic Stripe */}
          <rect x="2" y="7" width="32" height="3" fill="currentColor" fillOpacity="0.25" />
          {/* Chip */}
          <rect
            x="6"
            y="12"
            width="5"
            height="4"
            rx="1"
            fill="currentColor"
            fillOpacity="0.4"
          />
          {/* Embossed Dots */}
          <circle cx="15" cy="14" r="0.75" fill="currentColor" fillOpacity="0.3" />
          <circle cx="18" cy="14" r="0.75" fill="currentColor" fillOpacity="0.3" />
          <circle cx="21" cy="14" r="0.75" fill="currentColor" fillOpacity="0.3" />
          <circle cx="24" cy="14" r="0.75" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );
  }
}
