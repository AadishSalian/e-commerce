'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Transition } from 'framer-motion';
import { ShieldCheck, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import {
  ExtendedCardBrandId,
  CardBrandId,
  SecureFieldChangeEvent,
  VaultTokenResult,
} from '@/lib/payment/types';
import { CARD_BRAND_DEFINITIONS } from '@/lib/payment/cardBrands';
import { isBrandAccepted, getUnsupportedBrandMessage, DEFAULT_MERCHANT_CONFIG } from '@/lib/payment/config';
import { CardBrandIcon } from './CardBrandIcon';
import { CvvInfoPopover } from './CvvInfoPopover';
import { AcceptedBrandsRow } from './AcceptedBrandsRow';
import { HostedPaymentFields } from './HostedPaymentFields';

export interface SecureCardPaymentFormProps {
  onSuccess: (result: VaultTokenResult) => void;
  onError?: (errorMsg: string) => void;
  disabled?: boolean;
  submitButtonText?: string;
  amountFormatted?: string;
  className?: string;
}

/**
 * Production-ready PCI-DSS SAQ A Compliant Card Payment Form
 * with Brand Detection, Adaptive CVV Helper, and Matte Visual Theme.
 */
export function SecureCardPaymentForm({
  onSuccess,
  onError,
  disabled = false,
  submitButtonText,
  amountFormatted,
  className = '',
}: SecureCardPaymentFormProps) {
  const shouldReduceMotion = useReducedMotion();

  // Brand state
  const [detectedBrand, setDetectedBrand] = useState<ExtendedCardBrandId>('unknown');
  const [previousAnnouncedBrand, setPreviousAnnouncedBrand] = useState<ExtendedCardBrandId>('unknown');
  const [brandAnnouncement, setBrandAnnouncement] = useState('');
  const [hasBrandEverBeenEstablished, setHasBrandEverBeenEstablished] = useState(false);

  // Co-badged state (e.g. RuPay + Discover / Visa)
  const [coBadgedOptions, setCoBadgedOptions] = useState<CardBrandId[] | null>(null);
  const [selectedCoBadge, setSelectedCoBadge] = useState<CardBrandId | undefined>(undefined);

  // Cardholder name
  const [cardholderName, setCardholderName] = useState('');
  const [nameBlurred, setNameBlurred] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Provider fields completion tracking
  const [fieldStates, setFieldStates] = useState<Record<string, { complete: boolean; empty: boolean; error?: string }>>({
    cardNumber: { complete: false, empty: true },
    cardExpiry: { complete: false, empty: true },
    cardCvc: { complete: false, empty: true },
  });

  // Submission & Gateway lifecycle states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [scriptStatus, setScriptStatus] = useState<'loading' | 'ready' | 'blocked' | 'error'>('ready');
  const [tokenizeFnRef, setTokenizeFnRef] = useState<(() => Promise<{ token: string; last4: string; brand: CardBrandId; expMonth: number; expYear: number }>) | null>(null);

  // Check acceptance
  const isAccepted = isBrandAccepted(detectedBrand, DEFAULT_MERCHANT_CONFIG);
  const unsupportedMessage = !isAccepted ? getUnsupportedBrandMessage(detectedBrand) : null;

  // Handle Brand Change from the Hosted Field
  const handleBrandChange = (newBrand: ExtendedCardBrandId, coBadged?: CardBrandId[]) => {
    setDetectedBrand(newBrand);
    setCoBadgedOptions(coBadged && coBadged.length > 1 ? coBadged : null);

    if (newBrand !== 'unknown') {
      setHasBrandEverBeenEstablished(true);
    }

    // Accessibility Announcement (polite, ONCE per brand change, NEVER per keystroke, NEVER digits)
    if (newBrand !== previousAnnouncedBrand) {
      setPreviousAnnouncedBrand(newBrand);
      if (newBrand !== 'unknown') {
        const meta = CARD_BRAND_DEFINITIONS[newBrand];
        setBrandAnnouncement(`${meta ? meta.name : newBrand} card detected.`);
      } else {
        setBrandAnnouncement('');
      }
    }
  };

  // Handle Field Changes
  const handleFieldChange = (event: SecureFieldChangeEvent) => {
    setFieldStates((prev) => ({
      ...prev,
      [event.elementType]: {
        complete: event.complete,
        empty: event.empty,
        error: event.error?.message,
      },
    }));
  };

  // Cardholder name validation
  const handleNameBlur = () => {
    setNameBlurred(true);
    if (!cardholderName.trim()) {
      setNameError('Name on card is required');
    } else {
      setNameError(null);
    }
  };

  // Form completion & validity check
  const isFormComplete =
    fieldStates.cardNumber.complete &&
    fieldStates.cardExpiry.complete &&
    fieldStates.cardCvc.complete &&
    cardholderName.trim().length > 0 &&
    isAccepted &&
    !unsupportedMessage;

  // Handle Payment Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete || isSubmitting || disabled || !isAccepted) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      if (!tokenizeFnRef) {
        throw new Error('Payment gateway is initializing. Please try again in a moment.');
      }

      // Secure tokenization via provider
      const vaultResult = await tokenizeFnRef();

      onSuccess({
        token: vaultResult.token,
        card: {
          brand: vaultResult.brand,
          last4: vaultResult.last4,
          expMonth: vaultResult.expMonth,
          expYear: vaultResult.expYear,
        },
      });
    } catch (err: any) {
      const msg = err?.message || 'Payment failed. Please verify your card details.';
      setSubmissionError(msg);
      onError?.(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Motion tokens (180ms easeOut with 4px vertical shift)
  const logoTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.16, 1, 0.3, 1] };

  const cvcMeta = detectedBrand !== 'unknown' ? CARD_BRAND_DEFINITIONS[detectedBrand] : null;
  const cvcLabel = cvcMeta ? cvcMeta.securityCodeName : 'CVV';
  const cvcHelper = cvcMeta ? cvcMeta.securityCodeHelper : '3 or 4 digits, found on your card';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Polite Screen Reader Live Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {brandAnnouncement}
      </div>

      {/* Ad Blocker or Provider Error Alert */}
      {scriptStatus === 'blocked' && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-surface border border-warning/50 text-text-primary text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Payment Service Blocked</p>
            <p className="text-text-muted">
              An ad-blocker or browser shield may be preventing the secure payment gateway from loading.
              Please pause blocking on this page, or complete checkout using UPI or Wallet.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center gap-1.5 text-accent hover:underline font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Gateway
            </button>
          </div>
        </div>
      )}

      {/* Main Payment Card Form */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-5">
        <div className="flex justify-between items-center pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Secure Card Payment</h3>
          </div>
          <span className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" /> PCI-DSS SAQ A
          </span>
        </div>

        {/* 1. Card Number with Anchored Brand Logo Slot */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="secure-card-number"
              className="text-xs font-medium text-text-primary"
            >
              Card number
            </label>
            {/* Co-badged Card Selector if applicable */}
            {coBadgedOptions && coBadgedOptions.length > 1 && (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-text-muted">Network:</span>
                <select
                  value={selectedCoBadge || coBadgedOptions[0]}
                  onChange={(e) => setSelectedCoBadge(e.target.value as CardBrandId)}
                  className="bg-surface-active text-foreground border border-border rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-accent"
                  aria-label="Select co-badged payment network"
                >
                  {coBadgedOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      Pay with {CARD_BRAND_DEFINITIONS[opt]?.name || opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="relative">
            {/* The Hosted Provider Field */}
            <HostedPaymentFields
              onBrandChange={handleBrandChange}
              onFieldChange={handleFieldChange}
              selectedCoBadge={selectedCoBadge}
              disabled={disabled || isSubmitting}
              onTokenizeReady={setTokenizeFnRef}
              onScriptStatusChange={setScriptStatus}
            />

            {/* Anchored Brand Logo Slot (fixed 36x24 size, right aligned, never shifts layout) */}
            <div
              className="absolute right-3.5 top-3.5 w-9 h-6 flex items-center justify-center pointer-events-none select-none z-10"
              aria-hidden="true"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={detectedBrand}
                  initial={
                    hasBrandEverBeenEstablished
                      ? { opacity: 0, y: -4 }
                      : { opacity: 0 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={logoTransition}
                  className="flex items-center justify-center"
                >
                  <CardBrandIcon
                    brand={detectedBrand}
                    size={22}
                    aria-hidden="true"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 2. Expiry and CVV Section Headers & Info */}
        <div className="grid grid-cols-2 gap-4">
          <label
            htmlFor="secure-card-expiry"
            className="text-xs font-medium text-text-primary"
          >
            Expiry date (MM/YY)
          </label>
          <div className="flex justify-between items-center">
            <label
              htmlFor="secure-card-cvc"
              className="text-xs font-medium text-text-primary flex items-center gap-1"
            >
              <span>{cvcLabel}</span>
              <span className="text-[10px] text-text-muted font-normal">
                ({cvcHelper})
              </span>
            </label>
            <CvvInfoPopover brand={detectedBrand} label={cvcLabel} />
          </div>
        </div>

        {/* 3. Cardholder Name Field */}
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="secure-card-name"
            className="text-xs font-medium text-text-primary"
          >
            Name on card
          </label>
          <input
            id="secure-card-name"
            type="text"
            autoComplete="cc-name"
            autoCapitalize="words"
            spellCheck="false"
            value={cardholderName}
            onChange={(e) => {
              setCardholderName(e.target.value);
              if (nameBlurred && e.target.value.trim().length > 0) {
                setNameError(null);
              }
            }}
            onBlur={handleNameBlur}
            disabled={disabled || isSubmitting}
            placeholder="Aadish Salian"
            aria-invalid={nameError ? 'true' : 'false'}
            aria-describedby={nameError ? 'secure-card-name-error' : undefined}
            className={`w-full bg-surface border text-foreground px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all ${
              nameError ? 'border-error ring-1 ring-error/40' : 'border-border'
            } ${disabled || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {nameError && (
            <p
              id="secure-card-name-error"
              role="alert"
              className="text-xs text-error font-medium"
            >
              {nameError}
            </p>
          )}
        </div>

        {/* 4. Unsupported Brand Notification */}
        <AnimatePresence>
          {unsupportedMessage && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={logoTransition}
              className="p-3 rounded-xl bg-error/10 border border-error/30 text-xs text-error flex items-center gap-2 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{unsupportedMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Generic Submission Decline Error */}
        <AnimatePresence>
          {submissionError && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={logoTransition}
              className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-xs text-error flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Payment Declined</p>
                <p>{submissionError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. RBI 3-D Secure / OTP Advisory Notice */}
        <div className="pt-2 border-t border-border/50 text-[11px] text-text-muted flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <p>
            Your transaction will be authenticated securely via your bank’s 3-D Secure OTP portal.
            Please do not close or refresh this page during authentication.
          </p>
        </div>

        {/* 7. Submit Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormComplete || isSubmitting || disabled}
          className="w-full py-4 bg-foreground text-background font-semibold rounded-full hover:scale-[0.99] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[52px] shadow-lg shadow-foreground/5"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>
              {submitButtonText ||
                (amountFormatted ? `Pay ${amountFormatted}` : 'Authorize Payment')}
            </span>
          )}
        </button>

        {/* 8. Accepted Brands Row & Security Badge */}
        <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-border/60">
          <AcceptedBrandsRow />
          <span className="text-[11px] text-text-muted flex items-center gap-1">
            <Lock className="w-3 h-3 text-accent" /> 256-bit SSL encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
