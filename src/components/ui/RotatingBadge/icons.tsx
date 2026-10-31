import React from 'react';
import { BadgeIconType } from './types';

interface BadgeIconProps {
  type: BadgeIconType;
  className?: string;
  accent?: boolean;
}

export function CenterBadgeIcon({ type, className = '', accent = false }: BadgeIconProps) {
  const strokeColor = accent ? 'var(--accent)' : 'currentColor';
  const fillColor = accent ? 'var(--accent)' : 'currentColor';

  switch (type) {
    case 'arrow-return':
      return (
        <g className={className} stroke={strokeColor} fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          {/* Circular return path */}
          <path d="M 68 64 C 68 58 63 53.5 56 53.5 L 50 53.5" />
          {/* Arrowhead */}
          <path d="M 54.5 49.5 L 49.5 53.5 L 54.5 57.5" />
        </g>
      );

    case 'truck':
      return (
        <g className={className} stroke={strokeColor} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Cargo box */}
          <path d="M 48 51.5 H 63 V 65 H 48 Z" />
          {/* Cab */}
          <path d="M 63 55 H 67.5 L 71 59 V 65 H 63" />
          {/* Rear wheel */}
          <circle cx="53" cy="65.5" r="2.25" fill="var(--bg-secondary)" />
          {/* Front wheel */}
          <circle cx="67" cy="65.5" r="2.25" fill="var(--bg-secondary)" />
          {/* Axle connector */}
          <path d="M 55.25 65.5 H 64.75" />
        </g>
      );

    case 'shield':
      return (
        <g className={className} stroke={strokeColor} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Shield contour */}
          <path d="M 51.5 51.5 H 68.5 C 68.5 61.5 64 67 60 69 C 56 67 51.5 61.5 51.5 51.5 Z" />
          {/* Verification checkmark */}
          <path d="M 56.5 59.5 L 59 62 L 64 56.5" strokeWidth="1.75" />
        </g>
      );

    case 'brand-mark':
      return (
        <g className={className}>
          <text
            x="60"
            y="66.5"
            textAnchor="middle"
            fill={fillColor}
            fontSize="18"
            fontWeight="700"
            style={{
              fontFamily: 'var(--font-display), var(--font-sans), sans-serif',
              letterSpacing: '-0.02em',
              userSelect: 'none',
            }}
          >
            m.
          </text>
        </g>
      );

    default:
      return null;
  }
}
