'use client';

import React from 'react';
import './NewsletterCard.css';

import './NewsletterCardLight.css';

export const NewsletterCard: React.FC = () => {
  return (
    <div className="newsletter-wrapper">
      {/* Dark Mode Version */}
      <div className="newsletter-dark">
        <div className="newsletter-card">
          <span className="newsletter-card__title">Stay in the Loop</span>
          <p className="newsletter-card__content">
            Early access to new arrivals, private sales, and exclusive style drops.
          </p>
          <form className="newsletter-card__form" onSubmit={(e) => e.preventDefault()}>
            <input 
              required 
              type="email" 
              placeholder="Your email" 
              aria-label="Email address for newsletter"
            />
            <button type="submit" className="newsletter-card__button">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Light Mode Version (Brutalist) */}
      <div className="newsletter-light">
        <div className="brutalist-card">
          <span className="brutalist-card__title">Newsletter</span>
          <p className="brutalist-card__content">
            Get existential crisis delivered straight to your inbox every week.
          </p>
          <form className="brutalist-card__form" onSubmit={(e) => e.preventDefault()}>
            <input required type="email" placeholder="Your life" />
            <button type="submit" className="brutalist-card__button">Click me</button>
          </form>
        </div>
      </div>
    </div>
  );
};
