'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, CreditCard, ShieldCheck } from 'lucide-react';
import { SelectedEmiPlan } from '@/lib/emi/types';
import { formatEmiCurrency } from '@/lib/emi/calculator';

export default function CheckoutSuccessPage() {
  const [emiPlan, setEmiPlan] = useState<SelectedEmiPlan | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('matte_last_order_emi_plan');
      if (stored) {
        try {
          setEmiPlan(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored EMI plan', e);
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-8 md:pt-4 pb-32">
      <div className="container mx-auto px-4 text-center flex flex-col items-center max-w-lg">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-border mb-8 shadow-sm">
          <Check className="w-10 h-10 text-foreground" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Order Confirmed
        </h1>

        <p className="text-text-muted mb-8 text-sm leading-relaxed">
          Thank you for your purchase. Your order #ORD-938271 has been processed and
          is being prepared for shipment. You will receive an email confirmation shortly.
        </p>

        {/* Final Confirmation and Receipt: Tenure, Rate, Fees, and Total Payable (Requirement 6) */}
        {emiPlan && (
          <div className="w-full text-left p-6 rounded-2xl bg-surface border border-border mb-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-accent" />
                <span className="font-bold text-sm text-foreground">
                  {emiPlan.planType === 'pay_later'
                    ? 'Pay Later Financing'
                    : 'Payment Schedule'}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-active border border-border text-text-muted">
                {emiPlan.lenderName}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {emiPlan.planType === 'pay_later' ? (
                <>
                  <div className="flex justify-between text-text-muted">
                    <span>Due Date</span>
                    <span className="text-foreground font-semibold">
                      {emiPlan.payLaterDueDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Financing Fee</span>
                    <span className="text-foreground font-semibold">₹0</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-text-muted">
                    <span>Financing Tenure</span>
                    <span className="text-foreground font-semibold">
                      {emiPlan.tenureMonths} Months
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Monthly Installment</span>
                    <span className="text-foreground font-semibold tabular-nums">
                      {formatEmiCurrency(emiPlan.monthlyInstallment)} / month
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Interest Rate</span>
                    <span className="text-foreground font-semibold">
                      {emiPlan.isNoCost
                        ? '0% p.a. (No-cost EMI)'
                        : `${emiPlan.annualInterestRate}% p.a.`}
                    </span>
                  </div>
                  {emiPlan.downPayment > 0 && (
                    <div className="flex justify-between text-text-muted">
                      <span>Down Payment Paid</span>
                      <span className="text-foreground font-semibold tabular-nums">
                        {formatEmiCurrency(emiPlan.downPayment)}
                      </span>
                    </div>
                  )}
                  {emiPlan.processingFee > 0 && (
                    <div className="flex justify-between text-text-muted">
                      <span>Lender Processing Fee</span>
                      <span className="text-foreground font-semibold tabular-nums">
                        {formatEmiCurrency(emiPlan.processingFee)} (+GST)
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between pt-2 border-t border-border text-sm font-bold text-foreground">
                <span>Total Amount Payable</span>
                <span className="text-accent tabular-nums">
                  {formatEmiCurrency(emiPlan.totalPayable)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-text-muted/70 pt-2 flex items-center gap-1.5 border-t border-border/40">
              <ShieldCheck className="w-3 h-3 text-accent shrink-0" />
              <span>
                Authorized via partner bank. Debits will reflect on your monthly billing cycle.
              </span>
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/account"
            className="px-8 py-3 bg-surface border border-border text-foreground font-medium rounded-full hover:bg-surface-hover transition-colors duration-200 text-sm"
          >
            View Order
          </Link>
          <Link
            href="/products"
            className="px-8 py-3 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200 text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
