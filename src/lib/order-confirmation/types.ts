/**
 * Order Confirmation & Post-Purchase Types.
 * Strictly adheres to truthful commerce, security (no IDOR), and WCAG accessibility standards.
 */

import { SelectedEmiPlan } from '@/lib/emi/types';

export type PaymentStatus =
  | 'confirmed'           // Paid & verified by server
  | 'confirmed_cod'       // Confirmed under Cash on Delivery
  | 'payment_pending'     // Bank, UPI, or webhook awaiting confirmation
  | 'payment_failed'      // Declined, timeout, or requires customer action
  | 'partially_confirmed'; // Partial stock fulfillment with refund / split

export type FulfillmentStageKey =
  | 'placed'
  | 'processing'
  | 'packed'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered';

export interface TimelineStageEvent {
  key: FulfillmentStageKey;
  label: string;
  sublabel?: string;
  timestamp?: string; // ISO-8601 (Only for completed stages!)
  isCompleted: boolean;
  isCurrent: boolean;
  estimatedDateOrRange?: string; // e.g. "Thu 22 Oct to Sat 24 Oct" (labeled as estimate)
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface PersonalizationDetails {
  inscription: string;
  fontName: string;
  placement: string;
  finishStyle?: string;
  previewSvg?: string;
  approvedThumbnail?: string;
  productionDays: number; // e.g. 2-3 days
}

export interface OrderItemRecord {
  id: string;
  productId: string;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number; // In currency units (e.g. ₹2,490)
  linePrice: number;
  image: string;
  isPersonalized?: boolean;
  personalization?: PersonalizationDetails;
  isDigital?: boolean;
  isPickup?: boolean;
  fulfillmentStatus?: 'fulfilled' | 'unfulfilled' | 'cancelled_refunded';
  unfulfilledReason?: string;
}

export interface ShipmentGroup {
  id: string;
  shipmentNumber: number;
  totalShipments: number;
  title: string; // e.g. "Shipment 1: In-Stock Tech"
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery: {
    start: string; // ISO date YYYY-MM-DD
    end?: string;  // ISO date YYYY-MM-DD
    formattedDisplay: string; // "Thu 22 Oct to Sat 24 Oct"
    isEstimate: boolean;
    windowConfirmed: boolean;
    timeWindow?: string; // e.g. "2:00 PM - 5:00 PM"
  };
  items: OrderItemRecord[];
  stages: TimelineStageEvent[];
  signatureRequired?: boolean;
  whiteGloveAssembly?: boolean;
}

export interface OrderPaymentRecord {
  status: PaymentStatus;
  method: 'card' | 'upi' | 'cod' | 'netbanking' | 'emi' | 'wallet';
  methodTitle: string; // e.g. "Credit Card", "UPI", "Cash on Delivery", "EMI"
  maskedDetails: string; // "Visa ending 4242", "UPI: shopper@okhdfcbank"
  emiPlan?: SelectedEmiPlan;
  transactionId?: string;
  failureReason?: string;
  failureCode?: string;
  amountDueOnDelivery?: number;
  codInstructions?: string;
}

export interface OrderCustomerRecord {
  userId?: string;
  isGuest: boolean;
  email: string;
  maskedEmail: string; // "a***@gmail.com"
  phone: string;
  maskedPhone: string; // "•••••• 4210"
  firstName: string;
  lastName: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingAddress?: {
    line1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface OrderPricingRecord {
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  isShippingFree: boolean;
  taxGst: number;
  taxGstNumber?: string;
  personalizationFee: number;
  giftWrapFee: number;
  total: number; // Exact amount charged matching bank, invoice, and confirmation
  currency: string;
}

export interface OrderConfirmationRecord {
  id: string; // e.g. "ORD-948271"
  idempotencyKey: string;
  guestAccessToken: string; // High-entropy unguessable token
  tokenExpiresAt: string;   // ISO-8601
  createdAt: string;        // ISO-8601
  updatedAt: string;        // ISO-8601
  status: PaymentStatus;
  customer: OrderCustomerRecord;
  payment: OrderPaymentRecord;
  pricing: OrderPricingRecord;
  shipments: ShipmentGroup[];
  giftOptions?: {
    isGift: boolean;
    message?: string;
    hidePricesOnSlip: boolean;
  };
  editableUntil?: string;   // ISO-8601 (address changes allowed until this timestamp)
  cancellableUntil?: string;// ISO-8601
  crossSellProductIds?: string[];
}
