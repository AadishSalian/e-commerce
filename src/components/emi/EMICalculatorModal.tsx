'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  CreditCard,
  HelpCircle,
  Check,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Product } from '@/lib/mockData';
import {
  EMI_LENDERS,
  PAY_LATER_OPTIONS,
  FINANCIAL_DISCLOSURE_TEXT,
  LEGAL_DISCLAIMER_NOTE,
  getCategoryEmiConfig,
} from '@/config/emi';
import {
  calculateEmi,
  formatEmiCurrency,
} from '@/lib/emi/calculator';
import { SelectedEmiPlan } from '@/lib/emi/types';

interface EMICalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  livePrice?: number;
  onSelectPlan?: (plan: SelectedEmiPlan) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const STORAGE_KEY_TENURE = 'matte_emi_last_selected_tenure';

export const EMICalculatorModal: React.FC<EMICalculatorModalProps> = ({
  isOpen,
  onClose,
  product,
  livePrice,
  onSelectPlan,
  triggerRef,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const price = livePrice ?? product.price;
  const categoryConfig = useMemo(
    () => getCategoryEmiConfig(product.category),
    [product.category]
  );

  // Down Payment State: 0 to 50% of price
  const maxDownPayment = Math.floor(price * (categoryConfig.maxDownPaymentPercentage / 100));
  const [downPayment, setDownPayment] = useState<number>(0);

  // Tenure State: initialize from session state or category default
  const [selectedTenure, setSelectedTenure] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(STORAGE_KEY_TENURE);
      if (saved && categoryConfig.tenures.includes(Number(saved))) {
        return Number(saved);
      }
    }
    return categoryConfig.defaultTenure;
  });

  // Selected Lender State: default to first eligible credit card lender
  const [selectedLenderId, setSelectedLenderId] = useState<string>(() => {
    const defaultLender = EMI_LENDERS.find(
      (l) => l.isEligible?.(price).eligible !== false
    );
    return defaultLender ? defaultLender.id : EMI_LENDERS[0].id;
  });

  // Pay-later active mode or EMI mode
  const [activeTab, setActiveTab] = useState<'emi' | 'pay_later'>('emi');
  const [selectedPayLaterId, setSelectedPayLaterId] = useState<string>(
    PAY_LATER_OPTIONS[0].id
  );

  // Accordion for "How EMI works"
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  // Persist selected tenure in session state
  const handleTenureSelect = (tenure: number) => {
    setSelectedTenure(tenure);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY_TENURE, tenure.toString());
    }
  };

  // Find active lender
  const activeLender = useMemo(() => {
    return EMI_LENDERS.find((l) => l.id === selectedLenderId) || EMI_LENDERS[0];
  }, [selectedLenderId]);

  // Tenure options available for the active lender and product category
  const availableTenures = useMemo(() => {
    return categoryConfig.tenures.filter((t) => activeLender.rates[t] !== undefined);
  }, [categoryConfig.tenures, activeLender]);

  // Ensure selected tenure is valid for active lender
  useEffect(() => {
    if (availableTenures.length > 0 && !availableTenures.includes(selectedTenure)) {
      setSelectedTenure(availableTenures[0]);
    }
  }, [availableTenures, selectedTenure]);

  // Current rate configuration for the active lender & selected tenure
  const currentRateConfig = useMemo(() => {
    return (
      activeLender.rates[selectedTenure] || {
        annualRate: 14.0,
        isNoCost: false,
      }
    );
  }, [activeLender, selectedTenure]);

  // Full calculation result from the pure utility
  const calculationResult = useMemo(() => {
    return calculateEmi({
      price,
      downPayment,
      tenureMonths: selectedTenure,
      annualInterestRate: currentRateConfig.annualRate,
      processingFee: activeLender.processingFee,
      processingFeeGstRate: activeLender.processingFeeGstRate,
      otherFees: activeLender.otherFees,
      isNoCost: currentRateConfig.isNoCost,
    });
  }, [price, downPayment, selectedTenure, currentRateConfig, activeLender]);

  // Pay Later calculations
  const activePayLaterOption = useMemo(() => {
    return (
      PAY_LATER_OPTIONS.find((p) => p.id === selectedPayLaterId) ||
      PAY_LATER_OPTIONS[0]
    );
  }, [selectedPayLaterId]);

  const payLaterDueDate = useMemo(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + activePayLaterOption.tenureDays);
    return targetDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [activePayLaterOption.tenureDays]);

  // Focus trapping and Escape key handling for accessibility
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    const prevActiveElement = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const triggerNode = triggerRef?.current;
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Return focus to trigger
      if (triggerNode) {
        triggerNode.focus();
      } else if (prevActiveElement) {
        prevActiveElement.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  // Keyboard navigation for tenure pills (radiogroup pattern)
  const handleTenureKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % availableTenures.length;
      handleTenureSelect(availableTenures[nextIndex]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex =
        (index - 1 + availableTenures.length) % availableTenures.length;
      handleTenureSelect(availableTenures[prevIndex]);
    }
  };

  // Commit selected plan to cart / checkout
  const handleConfirmPlan = () => {
    if (!onSelectPlan) {
      onClose();
      return;
    }

    if (activeTab === 'pay_later') {
      const plan: SelectedEmiPlan = {
        planType: 'pay_later',
        lenderId: activePayLaterOption.id,
        lenderName: activePayLaterOption.provider,
        tenureMonths: 1,
        monthlyInstallment: price,
        annualInterestRate: 0,
        downPayment: 0,
        totalInterest: 0,
        processingFee: activePayLaterOption.fee,
        totalFees: activePayLaterOption.fee,
        totalPayable: price + activePayLaterOption.fee,
        isNoCost: true,
        payLaterDueDate,
        payLaterDays: activePayLaterOption.tenureDays,
        timestamp: Date.now(),
        originalPrice: price,
        productId: product.id,
      };
      onSelectPlan(plan);
    } else {
      const plan: SelectedEmiPlan = {
        planType: 'emi',
        lenderId: activeLender.id,
        lenderName: activeLender.name,
        cardType: activeLender.cardType,
        tenureMonths: selectedTenure,
        monthlyInstallment: calculationResult.monthlyInstallmentRupees,
        lastInstallment: calculationResult.lastInstallmentRupees,
        annualInterestRate: currentRateConfig.annualRate,
        downPayment,
        totalInterest: calculationResult.totalInterestRupees,
        processingFee: activeLender.processingFee,
        totalFees: calculationResult.totalFeesRupees,
        totalPayable: calculationResult.totalPayableRupees,
        isNoCost: calculationResult.isNoCost,
        noCostDiscount: calculationResult.noCostDiscountRupees,
        timestamp: Date.now(),
        originalPrice: price,
        productId: product.id,
      };
      onSelectPlan(plan);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emi-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal / Bottom Sheet Panel */}
        <motion.div
          ref={modalRef}
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { y: '100%', opacity: 1 }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { y: 0, opacity: 1 }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { y: '100%', opacity: 0.8 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.1 }
              : { type: 'spring', damping: 28, stiffness: 300 }
          }
          drag={shouldReduceMotion ? false : 'y'}
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 140 || info.velocity.y > 500) {
              onClose();
            }
          }}
          className="relative w-full md:max-w-xl max-h-[92vh] md:max-h-[88vh] bg-surface border border-border rounded-t-3xl md:rounded-2xl flex flex-col overflow-hidden text-foreground shadow-2xl z-10"
        >
          {/* Mobile Drag Indicator */}
          <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-12 h-1.5 rounded-full bg-border-strong opacity-80" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="emi-modal-title" className="text-xl font-bold tracking-tight">
                  EMI Options
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover border border-border text-text-muted font-medium">
                  {product.category}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {product.name} •{' '}
                <span className="font-semibold text-foreground">
                  {formatEmiCurrency(price)}
                </span>
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-full border border-border hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Close EMI calculator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="px-6 py-5 overflow-y-auto space-y-6 text-sm">
            {/* Tab Switcher: EMI vs Pay Later */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-active border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('emi')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'emi'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-text-muted hover:text-foreground'
                }`}
              >
                Monthly EMI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pay_later')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'pay_later'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-text-muted hover:text-foreground'
                }`}
              >
                Pay Later (15–30 Days)
              </button>
            </div>

            {activeTab === 'emi' ? (
              <>
                {/* 1. Down Payment Control */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="down-payment-slider"
                      className="text-xs font-medium uppercase tracking-wider text-text-muted"
                    >
                      Down Payment (0% – {categoryConfig.maxDownPaymentPercentage}%)
                    </label>
                    <div className="text-right">
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatEmiCurrency(downPayment)}
                      </span>
                      <span className="text-xs text-text-muted ml-1">
                        ({Math.round((downPayment / price) * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      id="down-payment-slider"
                      type="range"
                      min={0}
                      max={maxDownPayment}
                      step={100}
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      aria-label="Down payment amount slider"
                      aria-valuemin={0}
                      aria-valuemax={maxDownPayment}
                      aria-valuenow={downPayment}
                      aria-valuetext={`${formatEmiCurrency(downPayment)} down payment`}
                      className="w-full accent-[#8ed500] cursor-pointer h-1.5 bg-border rounded-lg"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>₹0 (Full Loan)</span>
                    <span>
                      Loan Principal:{' '}
                      <strong className="text-foreground tabular-nums">
                        {formatEmiCurrency(calculationResult.principalRupees)}
                      </strong>
                    </span>
                    <span>Max {formatEmiCurrency(maxDownPayment)}</span>
                  </div>
                </div>

                {/* 2. Tenure Selector (Pill Chips with shared-layout layoutId) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Select Tenure
                    </span>
                    {categoryConfig.tenures.includes(24) && (
                      <span className="text-[11px] text-accent font-medium">
                        Extended plans available for {product.category}
                      </span>
                    )}
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="EMI tenure in months"
                    className="flex flex-wrap gap-2"
                  >
                    {availableTenures.map((tenure, idx) => {
                      const isSelected = selectedTenure === tenure;
                      const tenureRate = activeLender.rates[tenure];
                      const isNoCost = tenureRate?.isNoCost;

                      return (
                        <button
                          key={tenure}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => handleTenureSelect(tenure)}
                          onKeyDown={(e) => handleTenureKeyDown(e, idx)}
                          className={`relative px-4 py-2 rounded-xl text-xs font-medium border transition-colors select-none flex flex-col items-center min-w-[70px] ${
                            isSelected
                              ? 'border-accent text-black font-semibold'
                              : 'border-border bg-surface-hover text-foreground hover:border-text-muted'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="activeTenureIndicator"
                              transition={
                                shouldReduceMotion
                                  ? { duration: 0 }
                                  : { type: 'spring', stiffness: 450, damping: 35 }
                              }
                              className="absolute inset-0 bg-[#8ed500] rounded-xl -z-10"
                            />
                          )}
                          <span className={isSelected ? 'text-black' : 'text-foreground'}>
                            {tenure} Mo
                          </span>
                          <span
                            className={`text-[9px] uppercase tracking-tight ${
                              isSelected
                                ? 'text-black/80 font-bold'
                                : isNoCost
                                ? 'text-accent font-bold'
                                : 'text-text-muted'
                            }`}
                          >
                            {isNoCost ? 'No Cost' : `${tenureRate?.annualRate || 14}%`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Result Card (Updates Live with Tabular Figures) */}
                <div
                  className="p-5 rounded-2xl bg-surface border border-border space-y-4"
                  aria-live="polite"
                  data-testid="emi-result-card"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
                        Monthly Payment
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <motion.span
                          key={`${calculationResult.monthlyInstallmentRupees}-${selectedTenure}`}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums"
                        >
                          {formatEmiCurrency(calculationResult.monthlyInstallmentRupees)}
                        </motion.span>
                        <span className="text-xs text-text-muted">
                          /month for {selectedTenure} months
                        </span>
                      </div>
                    </div>

                    {calculationResult.isNoCost && (
                      <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#8ed500]/40 bg-[#8ed500]/10 text-accent">
                        No-Cost EMI
                      </span>
                    )}
                  </div>

                  {/* Transparent Cost Breakdown */}
                  <div className="space-y-2 pt-3 border-t border-border/60 text-xs">
                    <div className="flex justify-between text-text-muted">
                      <span>Annual Interest Rate</span>
                      <span className="text-foreground font-medium tabular-nums">
                        {currentRateConfig.annualRate}% p.a.
                      </span>
                    </div>

                    {calculationResult.isNoCost ? (
                      <div className="p-2.5 rounded-lg bg-surface-active border border-border flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-tight text-text-muted">
                          <strong className="text-foreground">Zero Net Interest:</strong>{' '}
                          An upfront merchant discount of{' '}
                          <span className="text-foreground font-semibold tabular-nums">
                            {formatEmiCurrency(calculationResult.totalInterestRupees)}
                          </span>{' '}
                          offsets all bank interest.
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between text-text-muted">
                        <span>Total Interest Payable</span>
                        <span className="text-foreground font-medium tabular-nums">
                          {formatEmiCurrency(calculationResult.totalInterestRupees)}
                        </span>
                      </div>
                    )}

                    {activeLender.processingFee > 0 && (
                      <div className="flex justify-between text-text-muted">
                        <span>
                          Bank Processing Fee ({activeLender.shortName})
                        </span>
                        <span className="text-foreground font-medium tabular-nums">
                          {formatEmiCurrency(activeLender.processingFee)} + 18% GST (
                          {formatEmiCurrency(calculationResult.totalFeesRupees)})
                        </span>
                      </div>
                    )}

                    {downPayment > 0 && (
                      <div className="flex justify-between text-text-muted">
                        <span>Upfront Down Payment</span>
                        <span className="text-foreground font-medium tabular-nums">
                          {formatEmiCurrency(downPayment)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-border text-sm font-semibold text-foreground">
                      <span>Total Amount Payable</span>
                      <span className="text-base text-accent tabular-nums">
                        {formatEmiCurrency(calculationResult.totalPayableRupees)}
                      </span>
                    </div>

                    {/* Disclosure note regarding final installment rounding */}
                    {calculationResult.lastInstallmentRupees !==
                      calculationResult.monthlyInstallmentRupees && (
                      <p className="text-[10px] text-text-muted italic">
                        * Final (Month {selectedTenure}) installment is{' '}
                        {formatEmiCurrency(calculationResult.lastInstallmentRupees)} to
                        guarantee exact loan repayment without penny drift.
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Lender/Card Selection List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Select Bank / Card Provider
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {EMI_LENDERS.length} available
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {EMI_LENDERS.map((lender) => {
                      const isSelected = selectedLenderId === lender.id;
                      const eligibility = lender.isEligible
                        ? lender.isEligible(price)
                        : { eligible: true };
                      const isEligible = eligibility.eligible;
                      const tenureRate = lender.rates[selectedTenure];
                      const monthlyForLender = tenureRate
                        ? calculateEmi({
                            price,
                            downPayment,
                            tenureMonths: selectedTenure,
                            annualInterestRate: tenureRate.annualRate,
                            processingFee: lender.processingFee,
                            isNoCost: tenureRate.isNoCost,
                          }).monthlyInstallmentRupees
                        : null;

                      return (
                        <button
                          key={lender.id}
                          type="button"
                          disabled={!isEligible}
                          onClick={() => isEligible && setSelectedLenderId(lender.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-accent bg-surface-hover ring-1 ring-accent'
                              : isEligible
                              ? 'border-border bg-surface hover:border-text-muted'
                              : 'border-border/40 bg-surface/30 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-accent/40 bg-accent/10 text-accent'
                                  : 'border-border bg-surface-active text-text-muted'
                              }`}
                            >
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-xs text-foreground truncate">
                                  {lender.name}
                                </p>
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded border border-border text-text-muted">
                                  {lender.cardType}
                                </span>
                              </div>
                              {isEligible ? (
                                <p className="text-[11px] text-text-muted">
                                  {tenureRate?.isNoCost
                                    ? 'No-cost EMI'
                                    : `${tenureRate?.annualRate || 14}% p.a.`}{' '}
                                  • Processing fee ₹{lender.processingFee}
                                </p>
                              ) : (
                                <p className="text-[11px] text-amber-500 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {eligibility.reason || 'Not eligible'}
                                </p>
                              )}
                            </div>
                          </div>

                          {isEligible && monthlyForLender !== null && (
                            <div className="text-right shrink-0">
                              <span className="font-semibold text-xs text-foreground tabular-nums">
                                {formatEmiCurrency(monthlyForLender)}/mo
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Pay Later Option (Section 4) */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-surface border border-border space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    <div>
                      <h3 className="font-bold text-foreground">
                        Short-term Pay Later
                      </h3>
                      <p className="text-xs text-text-muted">
                        Buy today, settle within 15 to 30 days without interest.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PAY_LATER_OPTIONS.map((opt) => {
                      const isSelected = selectedPayLaterId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedPayLaterId(opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-accent bg-surface-hover ring-1 ring-accent'
                              : 'border-border bg-surface-active hover:border-text-muted'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs">{opt.title}</span>
                            {isSelected && <Check className="w-4 h-4 text-accent" />}
                          </div>
                          <p className="text-[11px] text-text-muted">
                            Provider: {opt.provider}
                          </p>
                          <p className="text-[11px] text-accent font-semibold mt-2">
                            Due: {payLaterDueDate}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-xl bg-surface-active border border-border text-xs text-text-muted space-y-1">
                    <p>
                      <strong className="text-foreground">Late Fees:</strong>{' '}
                      {activePayLaterOption.lateFeeTerms}
                    </p>
                    <p>
                      <strong className="text-foreground">Requirement:</strong>{' '}
                      {activePayLaterOption.eligibilityNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transparent Educational Accordion: "How EMI works" */}
            <div className="border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="w-full flex items-center justify-between text-xs text-text-muted hover:text-foreground py-1 focus:outline-none"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <HelpCircle className="w-3.5 h-3.5" />
                  How EMI works & Credit Limit Impact
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showHowItWorks ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {showHowItWorks && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3.5 rounded-xl bg-surface-active/60 border border-border space-y-2 text-xs text-text-muted">
                      <p>
                        <strong>1. Bank Authorization:</strong> The complete transaction
                        amount is blocked against your credit card limit immediately upon
                        purchase.
                      </p>
                      <p>
                        <strong>2. Monthly Conversion:</strong> Within 2–4 working days,
                        your bank converts the transaction into an EMI plan at the agreed
                        rate and tenure.
                      </p>
                      <p>
                        <strong>3. Credit Limit Restoration:</strong> As you pay each
                        monthly bill, that portion of your credit limit is released back.
                      </p>
                      <p>
                        <strong>4. No-Cost Funding:</strong> On zero-cost EMI plans,
                        the interest levied by the bank is provided upfront as an
                        instant discount from the product price.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Financial Disclosure & Legal Notice */}
            <div className="pt-2 text-[11px] text-text-muted/80 leading-relaxed space-y-1">
              <p className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                <span>{FINANCIAL_DISCLOSURE_TEXT}</span>
              </p>
              <p className="text-[10px] text-text-muted/60 pl-5">
                {LEGAL_DISCLAIMER_NOTE}
              </p>
            </div>
          </div>

          {/* Modal Footer / Primary Action */}
          <div className="p-4 md:p-6 border-t border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left w-full sm:w-auto">
              <p className="text-[11px] text-text-muted uppercase tracking-wider">
                {activeTab === 'pay_later' ? 'Pay Later Total' : 'Selected Plan'}
              </p>
              <p className="font-bold text-base text-foreground tabular-nums">
                {activeTab === 'pay_later'
                  ? formatEmiCurrency(price)
                  : `${formatEmiCurrency(
                      calculationResult.monthlyInstallmentRupees
                    )}/mo × ${selectedTenure} mo`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirmPlan}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-foreground text-background font-semibold text-sm hover:scale-[0.98] transition-transform shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Continue with this plan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EMICalculatorModal;
