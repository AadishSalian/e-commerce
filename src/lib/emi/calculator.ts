import {
  EmiCalculationParams,
  EmiCalculationResult,
  InstallmentBreakdown,
  TeaserResult,
  Lender,
} from './types';
import {
  EMI_MIN_AMOUNT,
  EMI_MAX_AMOUNT,
  EMI_LENDERS,
  getCategoryEmiConfig,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
} from '@/config/emi';

/**
 * Convert standard currency amount (rupees) to integer minor units (paise).
 * Avoids IEEE 754 floating-point precision inaccuracies.
 */
export function toPaise(rupees: number): number {
  return Math.round((rupees || 0) * 100);
}

/**
 * Convert integer minor units (paise) back to standard currency amount (rupees).
 */
export function toRupees(paise: number): number {
  return (paise || 0) / 100;
}

/**
 * Formats a currency amount using Intl.NumberFormat.
 * Defaults to INR (₹) and Indian numbering system (lakhs/crores).
 */
export function formatEmiCurrency(
  amount: number,
  locale: string = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY
): string {
  const rounded = Math.round(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Pure calculation function for standard reducing-balance EMI.
 *
 * Formula:
 *   r = annualRate / 12 / 100
 *   EMI = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
 *
 * For r = 0 (0% interest / No-Cost EMI):
 *   EMI = P / n
 *
 * Math is executed in integer minor units (paise).
 * Each installment (months 1..n-1) is rounded to whole rupees (multiples of 100 paise).
 * The exact remainder is placed into the final (n-th) installment so:
 *   sum(installments) === totalLoanRepayment
 * with zero-drift.
 */
export function calculateEmi(params: EmiCalculationParams): EmiCalculationResult {
  const {
    price,
    downPayment = 0,
    tenureMonths,
    annualInterestRate,
    processingFee = 0,
    processingFeeGstRate = 0.18,
    otherFees = 0,
    isNoCost = false,
  } = params;

  if (tenureMonths <= 0) {
    throw new Error('Tenure months must be greater than zero.');
  }

  const pricePaise = toPaise(price);
  const downPaymentPaise = Math.min(pricePaise, Math.max(0, toPaise(downPayment)));
  const principalPaise = pricePaise - downPaymentPaise;

  // Fees calculations in paise
  const processingFeePaise = toPaise(processingFee);
  const processingFeeGstPaise = Math.round(processingFeePaise * (processingFeeGstRate || 0));
  const otherFeesPaise = toPaise(otherFees);
  const totalFeesPaise = processingFeePaise + processingFeeGstPaise + otherFeesPaise;

  // Edge case: Loan fully paid off by down payment
  if (principalPaise <= 0) {
    return {
      pricePaise,
      priceRupees: toRupees(pricePaise),
      downPaymentPaise,
      downPaymentRupees: toRupees(downPaymentPaise),
      principalPaise: 0,
      principalRupees: 0,
      tenureMonths,
      annualInterestRate: 0,
      monthlyInterestRateDecimal: 0,
      monthlyInstallmentPaise: 0,
      monthlyInstallmentRupees: 0,
      lastInstallmentPaise: 0,
      lastInstallmentRupees: 0,
      totalLoanRepaymentPaise: 0,
      totalLoanRepaymentRupees: 0,
      totalInterestPaise: 0,
      totalInterestRupees: 0,
      processingFeePaise,
      processingFeeRupees: toRupees(processingFeePaise),
      processingFeeGstPaise,
      processingFeeGstRupees: toRupees(processingFeeGstPaise),
      otherFeesPaise,
      otherFeesRupees: toRupees(otherFeesPaise),
      totalFeesPaise,
      totalFeesRupees: toRupees(totalFeesPaise),
      totalPayablePaise: pricePaise + totalFeesPaise,
      totalPayableRupees: toRupees(pricePaise + totalFeesPaise),
      isNoCost: false,
      noCostDiscountPaise: 0,
      noCostDiscountRupees: 0,
      netPricePaidPaise: pricePaise,
      netPricePaidRupees: toRupees(pricePaise),
      schedule: [],
    };
  }

  const schedule: InstallmentBreakdown[] = [];
  let monthlyInstallmentPaise = 0;
  let lastInstallmentPaise = 0;
  let totalLoanRepaymentPaise = 0;
  let totalInterestPaise = 0;

  const isZeroRate = annualInterestRate === 0 || isNoCost;

  if (isZeroRate) {
    // 0% interest case: EMI = P / n
    // Round standard installment to nearest whole rupee (multiple of 100 paise)
    const exactMonthlyPaise = principalPaise / tenureMonths;
    const roundedRupees = Math.round(exactMonthlyPaise / 100);
    monthlyInstallmentPaise = roundedRupees * 100;

    let remainingBalancePaise = principalPaise;

    for (let month = 1; month <= tenureMonths; month++) {
      if (month < tenureMonths) {
        const principalPartPaise = monthlyInstallmentPaise;
        remainingBalancePaise -= principalPartPaise;
        schedule.push({
          month,
          installmentPaise: monthlyInstallmentPaise,
          installmentRupees: toRupees(monthlyInstallmentPaise),
          principalPartPaise,
          principalPartRupees: toRupees(principalPartPaise),
          interestPartPaise: 0,
          interestPartRupees: 0,
          closingBalancePaise: Math.max(0, remainingBalancePaise),
          closingBalanceRupees: toRupees(Math.max(0, remainingBalancePaise)),
        });
      } else {
        // Month n (final): absorbs exact remainder
        lastInstallmentPaise = remainingBalancePaise;
        schedule.push({
          month,
          installmentPaise: lastInstallmentPaise,
          installmentRupees: toRupees(lastInstallmentPaise),
          principalPartPaise: lastInstallmentPaise,
          principalPartRupees: toRupees(lastInstallmentPaise),
          interestPartPaise: 0,
          interestPartRupees: 0,
          closingBalancePaise: 0,
          closingBalanceRupees: 0,
        });
      }
    }

    totalLoanRepaymentPaise = principalPaise;
    totalInterestPaise = 0;
  } else {
    // Standard reducing-balance EMI formula
    const monthlyRateDecimal = annualInterestRate / (12 * 100);
    const compoundFactor = Math.pow(1 + monthlyRateDecimal, tenureMonths);
    const exactEmiPaise =
      (principalPaise * (monthlyRateDecimal * compoundFactor)) / (compoundFactor - 1);

    // Standard installment rounded to whole rupees (multiples of 100 paise)
    const standardRupees = Math.round(exactEmiPaise / 100);
    monthlyInstallmentPaise = standardRupees * 100;

    let balancePaise = principalPaise;
    let accumulatedInterestPaise = 0;

    for (let month = 1; month <= tenureMonths; month++) {
      if (month < tenureMonths) {
        const interestPartPaise = Math.round(balancePaise * monthlyRateDecimal);
        accumulatedInterestPaise += interestPartPaise;
        const principalPartPaise = monthlyInstallmentPaise - interestPartPaise;
        balancePaise -= principalPartPaise;

        schedule.push({
          month,
          installmentPaise: monthlyInstallmentPaise,
          installmentRupees: toRupees(monthlyInstallmentPaise),
          principalPartPaise,
          principalPartRupees: toRupees(principalPartPaise),
          interestPartPaise,
          interestPartRupees: toRupees(interestPartPaise),
          closingBalancePaise: Math.max(0, balancePaise),
          closingBalanceRupees: toRupees(Math.max(0, balancePaise)),
        });
      } else {
        // Month n (final): interest on remaining balance + balance itself
        const interestPartPaise = Math.round(balancePaise * monthlyRateDecimal);
        accumulatedInterestPaise += interestPartPaise;
        const principalPartPaise = balancePaise;
        lastInstallmentPaise = principalPartPaise + interestPartPaise;

        schedule.push({
          month,
          installmentPaise: lastInstallmentPaise,
          installmentRupees: toRupees(lastInstallmentPaise),
          principalPartPaise,
          principalPartRupees: toRupees(principalPartPaise),
          interestPartPaise,
          interestPartRupees: toRupees(interestPartPaise),
          closingBalancePaise: 0,
          closingBalanceRupees: 0,
        });
      }
    }

    totalInterestPaise = accumulatedInterestPaise;
    totalLoanRepaymentPaise =
      monthlyInstallmentPaise * (tenureMonths - 1) + lastInstallmentPaise;
  }

  // Grand Total Payable = Down Payment + All Installments + All Fees
  const totalPayablePaise = downPaymentPaise + totalLoanRepaymentPaise + totalFeesPaise;

  // No-cost EMI calculation particulars
  const noCostDiscountPaise = isNoCost ? totalInterestPaise : 0;
  const netPricePaidPaise = pricePaise - noCostDiscountPaise;

  return {
    pricePaise,
    priceRupees: toRupees(pricePaise),
    downPaymentPaise,
    downPaymentRupees: toRupees(downPaymentPaise),
    principalPaise,
    principalRupees: toRupees(principalPaise),
    tenureMonths,
    annualInterestRate,
    monthlyInterestRateDecimal: annualInterestRate / (12 * 100),
    monthlyInstallmentPaise,
    monthlyInstallmentRupees: toRupees(monthlyInstallmentPaise),
    lastInstallmentPaise,
    lastInstallmentRupees: toRupees(lastInstallmentPaise),
    totalLoanRepaymentPaise,
    totalLoanRepaymentRupees: toRupees(totalLoanRepaymentPaise),
    totalInterestPaise,
    totalInterestRupees: toRupees(totalInterestPaise),
    processingFeePaise,
    processingFeeRupees: toRupees(processingFeePaise),
    processingFeeGstPaise,
    processingFeeGstRupees: toRupees(processingFeeGstPaise),
    otherFeesPaise,
    otherFeesRupees: toRupees(otherFeesPaise),
    totalFeesPaise,
    totalFeesRupees: toRupees(totalFeesPaise),
    totalPayablePaise,
    totalPayableRupees: toRupees(totalPayablePaise),
    isNoCost: isZeroRate,
    noCostDiscountPaise,
    noCostDiscountRupees: toRupees(noCostDiscountPaise),
    netPricePaidPaise,
    netPricePaidRupees: toRupees(netPricePaidPaise),
    schedule,
  };
}

/**
 * Asserts the mathematical invariant:
 * downPayment + sum(installments) + fees === totalPayable
 * with zero drift.
 */
export function verifyTotalPayable(result: EmiCalculationResult): boolean {
  const sumInstallments =
    result.monthlyInstallmentPaise * (result.tenureMonths - 1) +
    result.lastInstallmentPaise;

  const exactMatchesRepayment = sumInstallments === result.totalLoanRepaymentPaise;
  const grandTotalMatches =
    result.downPaymentPaise +
      result.totalLoanRepaymentPaise +
      result.totalFeesPaise ===
    result.totalPayablePaise;

  return exactMatchesRepayment && grandTotalMatches;
}

/**
 * Inline Teaser Calculation:
 * - Longest eligible tenure at the lowest available interest rate.
 * - Minimum amount check (returns null below minimum).
 * - Read from configured dynamic lenders.
 */
export function calculateTeaser(
  price: number,
  category?: string,
  lenders: Lender[] = EMI_LENDERS,
  minAmountOverride?: number
): TeaserResult | null {
  const categoryConfig = getCategoryEmiConfig(category);
  const minAmount = minAmountOverride ?? categoryConfig.minAmount ?? EMI_MIN_AMOUNT;

  if (price < minAmount || price > EMI_MAX_AMOUNT) {
    return null;
  }

  const supportedTenures = categoryConfig.tenures;

  // Filter lenders that are eligible for this price
  const eligibleLenders = lenders.filter((lender) => {
    if (price < lender.minAmount) return false;
    if (lender.maxAmount && price > lender.maxAmount) return false;
    if (lender.isEligible && !lender.isEligible(price).eligible) return false;
    return true;
  });

  if (eligibleLenders.length === 0) {
    return null;
  }

  // Search for the plan offering the lowest monthly installment:
  // Usually this corresponds to the lowest rate at the longest tenure.
  let bestPlan: {
    monthlyInstallment: number;
    tenure: number;
    annualRate: number;
    isNoCost: boolean;
    lenderName: string;
    lenderId: string;
    totalPayable: number;
  } | null = null;

  for (const lender of eligibleLenders) {
    for (const tenure of supportedTenures) {
      const rateConfig = lender.rates[tenure];
      if (!rateConfig) continue;

      const calc = calculateEmi({
        price,
        downPayment: 0,
        tenureMonths: tenure,
        annualInterestRate: rateConfig.annualRate,
        processingFee: lender.processingFee,
        processingFeeGstRate: lender.processingFeeGstRate,
        otherFees: lender.otherFees,
        isNoCost: rateConfig.isNoCost,
      });

      // Priority criteria:
      // 1. Lowest monthly installment
      // 2. If equal, higher tenure (longer tenure gives customer more flexibility)
      // 3. If equal, prefer No-Cost
      if (
        !bestPlan ||
        calc.monthlyInstallmentRupees < bestPlan.monthlyInstallment ||
        (calc.monthlyInstallmentRupees === bestPlan.monthlyInstallment &&
          tenure > bestPlan.tenure) ||
        (calc.monthlyInstallmentRupees === bestPlan.monthlyInstallment &&
          tenure === bestPlan.tenure &&
          rateConfig.isNoCost &&
          !bestPlan.isNoCost)
      ) {
        bestPlan = {
          monthlyInstallment: calc.monthlyInstallmentRupees,
          tenure,
          annualRate: rateConfig.annualRate,
          isNoCost: !!rateConfig.isNoCost,
          lenderName: lender.shortName,
          lenderId: lender.id,
          totalPayable: calc.totalPayableRupees,
        };
      }
    }
  }

  if (!bestPlan) return null;

  return {
    minMonthlyAmount: bestPlan.monthlyInstallment,
    longestTenure: bestPlan.tenure,
    lowestRate: bestPlan.annualRate,
    isNoCost: bestPlan.isNoCost,
    lenderName: bestPlan.lenderName,
    lenderId: bestPlan.lenderId,
    totalPayable: bestPlan.totalPayable,
  };
}
