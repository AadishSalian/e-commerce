export type CardType = 'credit' | 'debit' | 'cardless';

export interface LenderRateConfig {
  annualRate: number; // e.g. 14.5 for 14.5%
  isNoCost?: boolean;
  discountOffset?: boolean;
}

export interface Lender {
  id: string;
  name: string;
  shortName: string;
  cardType: CardType;
  minAmount: number;
  maxAmount?: number;
  processingFee: number; // in rupees
  processingFeeGstRate?: number; // e.g. 0.18 for 18% GST
  otherFees?: number;
  rates: Record<number, LenderRateConfig>; // tenure in months -> rate config
  eligibilityDescription?: string;
  isEligible?: (amount: number) => { eligible: boolean; reason?: string };
}

export interface PayLaterOption {
  id: string;
  title: string;
  provider: string;
  tenureDays: 15 | 30;
  fee: number;
  lateFeeTerms: string;
  minAmount: number;
  maxAmount: number;
  eligibilityNote: string;
}

export interface EmiCalculationParams {
  price: number; // in standard currency (rupees)
  downPayment?: number; // in rupees (0 to 50% of price)
  tenureMonths: number;
  annualInterestRate: number; // annual rate as percentage, e.g. 13.5
  processingFee?: number; // in rupees
  processingFeeGstRate?: number; // e.g. 0.18
  otherFees?: number; // in rupees
  isNoCost?: boolean;
}

export interface InstallmentBreakdown {
  month: number;
  installmentPaise: number;
  installmentRupees: number;
  principalPartPaise: number;
  principalPartRupees: number;
  interestPartPaise: number;
  interestPartRupees: number;
  closingBalancePaise: number;
  closingBalanceRupees: number;
}

export interface EmiCalculationResult {
  // Principal & Down Payment
  pricePaise: number;
  priceRupees: number;
  downPaymentPaise: number;
  downPaymentRupees: number;
  principalPaise: number;
  principalRupees: number;

  // Monthly Installments
  tenureMonths: number;
  annualInterestRate: number;
  monthlyInterestRateDecimal: number;
  monthlyInstallmentPaise: number; // months 1 to n-1
  monthlyInstallmentRupees: number;
  lastInstallmentPaise: number; // month n, contains exact rounding remainder
  lastInstallmentRupees: number;

  // Repayment & Interest
  totalLoanRepaymentPaise: number; // sum of all installments
  totalLoanRepaymentRupees: number;
  totalInterestPaise: number;
  totalInterestRupees: number;

  // Fees & Charges
  processingFeePaise: number;
  processingFeeRupees: number;
  processingFeeGstPaise: number;
  processingFeeGstRupees: number;
  otherFeesPaise: number;
  otherFeesRupees: number;
  totalFeesPaise: number;
  totalFeesRupees: number;

  // Grand Total Payable
  totalPayablePaise: number; // downPayment + totalLoanRepayment + fees
  totalPayableRupees: number;

  // No-cost EMI particulars
  isNoCost: boolean;
  noCostDiscountPaise: number;
  noCostDiscountRupees: number;
  netPricePaidPaise: number;
  netPricePaidRupees: number;

  // Full amortization schedule
  schedule: InstallmentBreakdown[];
}

export interface SelectedEmiPlan {
  planType: 'emi' | 'pay_later';
  lenderId: string;
  lenderName: string;
  cardType?: CardType;
  tenureMonths: number;
  monthlyInstallment: number;
  lastInstallment?: number;
  annualInterestRate: number;
  downPayment: number;
  totalInterest: number;
  processingFee: number;
  totalFees: number;
  totalPayable: number;
  isNoCost: boolean;
  noCostDiscount?: number;
  payLaterDueDate?: string;
  payLaterDays?: number;
  timestamp: number;
  originalPrice: number;
  productId?: string;
}

export interface TeaserResult {
  minMonthlyAmount: number;
  longestTenure: number;
  lowestRate: number;
  isNoCost: boolean;
  lenderName: string;
  lenderId: string;
  totalPayable: number;
}
