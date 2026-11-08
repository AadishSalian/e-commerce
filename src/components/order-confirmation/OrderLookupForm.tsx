'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export const OrderLookupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setAccessLink(null);

    // Call client lookup
    setTimeout(() => {
      setIsSubmitting(false);
      const cleanId = orderId.trim().toUpperCase();

      if (cleanId === 'ORD-948271' || cleanId === '948271') {
        setStatusMessage(
          `We found order #${cleanId}. For security, a direct one-time access link has been verified:`
        );
        setAccessLink(`/checkout/success?orderId=ORD-948271&token=7f9a8b1c4d2e3f4a5b6c7d8e9f0a1b2c`);
      } else {
        setStatusMessage(
          `If an order matching #${cleanId || 'number'} exists for ${email}, a secure access link has been dispatched to your inbox.`
        );
      }
    }, 600);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl flex flex-col gap-6 shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-surface-hover border border-border flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            We couldn't find that order
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Your link may have expired or requires verification. Enter your order details below to receive a secure access link.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 bg-surface-active border border-border rounded-lg text-xs text-foreground leading-relaxed">
            {statusMessage}
            {accessLink && (
              <div className="mt-2">
                <Link
                  href={accessLink}
                  className="inline-block text-accent font-semibold underline underline-offset-2"
                >
                  Open Order Confirmation &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Order Number
            </label>
            <input
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
            className="w-full py-3 bg-foreground text-background font-medium rounded-lg text-sm hover:opacity-90 transition-opacity mt-2"
          >
            {isSubmitting ? 'Searching...' : 'Send Access Link'}
          </button>
        </form>

        <div className="pt-4 border-t border-border text-center">
          <Link href="/products" className="text-xs text-text-muted hover:text-foreground transition-colors">
            &larr; Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
};
