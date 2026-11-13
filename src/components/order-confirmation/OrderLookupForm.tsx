'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export const OrderLookupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Constant-time simulation to prevent timing attacks
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 650);
  };

  const cleanId = orderId.trim().toUpperCase() || 'NUMBER';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl flex flex-col gap-6 shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-surface-hover border border-border flex items-center justify-center mx-auto mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-muted"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            We couldn't find that order
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Your link may have expired or requires owner verification. Enter your order details below to receive a secure access link.
          </p>
        </div>

        {submitted ? (
          <div
            className="p-4 bg-surface-active border border-border rounded-lg text-xs text-foreground leading-relaxed flex flex-col gap-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              <span>
                If an order matching <strong>#{cleanId}</strong> exists for{' '}
                <strong>{email}</strong>, a secure, single-use access link has been dispatched to that email address.
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              For security, this lookup does not confirm whether an order exists. Please allow 1–2 minutes for the email to arrive and check your spam folder.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-xs text-accent underline self-start cursor-pointer mt-1"
            >
              Search another order
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lookup-email" className="text-xs font-medium text-text-secondary">
                Email Address
              </label>
              <input
                id="lookup-email"
                type="email"
                required
                autoComplete="email"
                placeholder="e.g. alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="lookup-order-id" className="text-xs font-medium text-text-secondary">
                Order Number
              </label>
              <input
                id="lookup-order-id"
                type="text"
                required
                placeholder="e.g. ORD-948271"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-3 bg-foreground text-background font-medium rounded-lg text-sm hover:opacity-90 transition-opacity mt-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Searching...' : 'Send Access Link'}
            </button>
          </form>
        )}

        {/* Demo Test Scenarios Selector for easy verification */}
        <div className="pt-4 border-t border-border flex flex-col gap-2">
          <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
            Explore Demo Order States:
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <Link
              href="/checkout/success?orderId=ORD-948271&token=7f9a8b1c4d2e3f4a5b6c7d8e9f0a1b2c"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Confirmed Paid (Split)
            </Link>
            <Link
              href="/checkout/success?orderId=ORD-552109&token=a1b2c3d4e5f6789012345678abcdef01"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Confirmed COD
            </Link>
            <Link
              href="/checkout/success?orderId=ORD-PENDING-UPI&token=pendingtoken1234567890abcdef1234"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Payment Pending
            </Link>
            <Link
              href="/checkout/success?orderId=ORD-FAILED-CARD&token=failedtoken1234567890abcdef1234"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Payment Failed
            </Link>
            <Link
              href="/checkout/success?orderId=ORD-PARTIAL-SPLIT&token=partialtoken1234567890abcdef123"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Partially Confirmed
            </Link>
            <Link
              href="/checkout/success?orderId=ORD-PICKUP-STORE&token=pickuptoken1234567890abcdef123"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Store Pickup
            </Link>
            <Link
              href="/checkout/success?orderId=ORD-DIGITAL-ONLY&token=digitaltoken1234567890abcdef12"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Digital Gift Card
            </Link>
            <Link
              href="/checkout/success?orderId=ORD-DATE-UNKNOWN&token=unknowndatetoken1234567890abcdef"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Delivery Date Unknown
            </Link>
            <Link
              href="/checkout/success?orderId=ORD-MANY-ITEMS&token=manyitemstoken1234567890abcdef1"
              className="px-2 py-1 bg-surface-hover hover:bg-surface-active rounded border border-border text-text-secondary hover:text-foreground transition-colors"
            >
              Many Items (Mobile Collapse)
            </Link>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            href="/products"
            className="text-xs text-text-muted hover:text-foreground transition-colors underline underline-offset-2"
          >
            &larr; Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
};
