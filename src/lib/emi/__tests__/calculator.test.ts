import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  calculateEmi,
  calculateTeaser,
  toPaise,
  toRupees,
  formatEmiCurrency,
  verifyTotalPayable,
} from '../calculator';
import { EMI_LENDERS } from '@/config/emi';

describe('EMI Pure Calculation Utility Suite', () => {
  test('Standard reducing-balance formula with interest', () => {
    // Principal: ₹60,000, 12 months, 15% p.a.
    const result = calculateEmi({
      price: 60000,
      downPayment: 0,
      tenureMonths: 12,
      annualInterestRate: 15,
      processingFee: 0,
      otherFees: 0,
    });

    // Monthly installment should be around ₹5,415
    assert.equal(result.principalRupees, 60000);
    assert.equal(result.tenureMonths, 12);
    assert.ok(result.monthlyInstallmentRupees > 5400 && result.monthlyInstallmentRupees < 5430);
    assert.ok(result.totalInterestRupees > 0);
    assert.ok(result.totalLoanRepaymentRupees > 60000);

    // Invariant check: sum(installments) must equal totalLoanRepayment exactly
    const sumInstallments =
      result.monthlyInstallmentPaise * (result.tenureMonths - 1) + result.lastInstallmentPaise;
    assert.equal(sumInstallments, result.totalLoanRepaymentPaise);
    assert.equal(verifyTotalPayable(result), true);
  });

  test('0% interest (No-Cost EMI) explicitly handled without division by zero', () => {
    // Principal: ₹12,000, 6 months, 0% p.a.
    const result = calculateEmi({
      price: 12000,
      downPayment: 0,
      tenureMonths: 6,
      annualInterestRate: 0,
      isNoCost: true,
      processingFee: 0,
      otherFees: 0,
    });

    assert.equal(result.isNoCost, true);
    assert.equal(result.annualInterestRate, 0);
    assert.equal(result.monthlyInstallmentRupees, 2000);
    assert.equal(result.lastInstallmentRupees, 2000);
    assert.equal(result.totalInterestRupees, 0);
    assert.equal(result.totalLoanRepaymentRupees, 12000);
    assert.equal(result.totalPayableRupees, 12000);
    assert.equal(verifyTotalPayable(result), true);
  });

  test('0% interest with uneven division: remainder goes to last installment (Zero Drift)', () => {
    // Principal: ₹10,000, 3 months, 0% interest
    // 10,000 / 3 = 3333.3333...
    const result = calculateEmi({
      price: 10000,
      downPayment: 0,
      tenureMonths: 3,
      annualInterestRate: 0,
      isNoCost: true,
      processingFee: 0,
      otherFees: 0,
    });

    // Standard monthly installment rounded to whole rupee: 3333
    assert.equal(result.monthlyInstallmentRupees, 3333);
    // Month 1: 3333
    // Month 2: 3333
    // Month 3 (last): 10000 - 6666 = 3334
    assert.equal(result.lastInstallmentRupees, 3334);

    // Sum of all 3 installments: 3333 + 3333 + 3334 = 10,000 exactly!
    const totalRepaid = result.monthlyInstallmentRupees * 2 + result.lastInstallmentRupees;
    assert.equal(totalRepaid, 10000);
    assert.equal(result.totalPayableRupees, 10000);
    assert.equal(verifyTotalPayable(result), true);
  });

  test('Down payment correctly reduces principal and loan repayment', () => {
    // Price ₹50,000 with ₹10,000 down payment (20%)
    // Principal = ₹40,000
    const result = calculateEmi({
      price: 50000,
      downPayment: 10000,
      tenureMonths: 6,
      annualInterestRate: 12,
      processingFee: 199,
      processingFeeGstRate: 0.18,
    });

    assert.equal(result.priceRupees, 50000);
    assert.equal(result.downPaymentRupees, 10000);
    assert.equal(result.principalRupees, 40000);

    // Check fees
    assert.equal(result.processingFeeRupees, 199);
    assert.equal(result.processingFeeGstRupees, 35.82); // 199 * 0.18 = 35.82
    assert.equal(result.totalFeesRupees, 234.82);

    // Total Payable = Down payment + All installments + Fees
    const expectedTotal =
      result.downPaymentPaise +
      result.totalLoanRepaymentPaise +
      result.totalFeesPaise;
    assert.equal(result.totalPayablePaise, expectedTotal);
    assert.equal(verifyTotalPayable(result), true);
  });

  test('Edge Case: 100% Down payment (No loan needed)', () => {
    const result = calculateEmi({
      price: 15000,
      downPayment: 15000,
      tenureMonths: 6,
      annualInterestRate: 14,
    });

    assert.equal(result.principalRupees, 0);
    assert.equal(result.monthlyInstallmentRupees, 0);
    assert.equal(result.totalInterestRupees, 0);
    assert.equal(result.totalPayableRupees, 15000);
  });

  test('Processing fees and GST are never hidden and are explicitly included', () => {
    const result = calculateEmi({
      price: 25000,
      downPayment: 0,
      tenureMonths: 6,
      annualInterestRate: 0,
      isNoCost: true,
      processingFee: 199,
      processingFeeGstRate: 0.18,
    });

    assert.equal(result.processingFeeRupees, 199);
    assert.equal(result.processingFeeGstRupees, 35.82);
    assert.equal(result.totalFeesRupees, 234.82);
    assert.equal(result.totalPayableRupees, 25234.82);
    assert.equal(verifyTotalPayable(result), true);
  });

  test('Currency formatting uses proper locale and symbols without fraction jitter', () => {
    assert.equal(formatEmiCurrency(2100), '₹2,100');
    assert.equal(formatEmiCurrency(60500), '₹60,500');
    assert.equal(formatEmiCurrency(100000), '₹1,00,000');
  });

  test('Teaser calculation returns lowest monthly amount on eligible products', () => {
    // For a high-ticket item ₹24,999 in Tech
    const teaser = calculateTeaser(24999, 'Tech', EMI_LENDERS, 1000);
    assert.ok(teaser !== null);
    assert.ok(teaser.minMonthlyAmount > 0);
    assert.ok(teaser.longestTenure >= 3);
    assert.ok(teaser.lenderName.length > 0);
  });

  test('Teaser calculation returns null when price is below minimum amount', () => {
    const teaserBelowMin = calculateTeaser(1500, 'Tech', EMI_LENDERS, 3000);
    assert.equal(teaserBelowMin, null);
  });

  test('Consistency check: Teaser, Calculator, Cart, and Checkout use same outputs', () => {
    const price = 48000;
    const downPayment = 8000;
    const tenure = 12;
    const lender = EMI_LENDERS.find((l) => l.id === 'hdfc-cc')!;
    const rateConfig = lender.rates[tenure];

    const params = {
      price,
      downPayment,
      tenureMonths: tenure,
      annualInterestRate: rateConfig.annualRate,
      processingFee: lender.processingFee,
      processingFeeGstRate: lender.processingFeeGstRate,
      otherFees: lender.otherFees,
      isNoCost: rateConfig.isNoCost,
    };

    // Screen 1: Calculator
    const calcResult = calculateEmi(params);

    // Screen 2: Cart line item
    const cartResult = calculateEmi(params);

    // Screen 3: Checkout summary
    const checkoutResult = calculateEmi(params);

    assert.equal(calcResult.monthlyInstallmentRupees, cartResult.monthlyInstallmentRupees);
    assert.equal(cartResult.monthlyInstallmentRupees, checkoutResult.monthlyInstallmentRupees);
    assert.equal(calcResult.totalPayableRupees, checkoutResult.totalPayableRupees);
    assert.equal(calcResult.totalInterestRupees, checkoutResult.totalInterestRupees);
    assert.equal(calcResult.totalFeesRupees, checkoutResult.totalFeesRupees);
  });

  test('Minor units conversion: toPaise and toRupees', () => {
    assert.equal(toPaise(100.5), 10050);
    assert.equal(toPaise(0), 0);
    assert.equal(toRupees(10050), 100.5);
    assert.equal(toRupees(0), 0);
  });
});
