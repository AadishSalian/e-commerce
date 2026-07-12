'use client';

import React from 'react';
import './SalesCard.css';

interface SalesCardProps {
  title?: string;
  text?: string;
  badgeValue?: string;
  badgeLabel?: string;
  ctaText?: string;
  onClick?: () => void;
}

export const SalesCard: React.FC<SalesCardProps> = ({
  title = "Season Sale",
  text = "Up to 50% off selected styles, while stocks last.",
  badgeValue = "50%",
  badgeLabel = "OFF",
  ctaText = "See More",
  onClick
}) => {
  return (
    <div className="parent" tabIndex={0}>
      <div className="card">
        <div className="content-box">
          <span className="card-title">{title}</span>
          <p className="card-content">{text}</p>
          <span className="see-more" onClick={onClick}>
            {ctaText}
          </span>
        </div>
        <div className="date-box">
          <span className="month">{badgeLabel}</span>
          <span className="date">{badgeValue}</span>
        </div>
      </div>
    </div>
  );
};
