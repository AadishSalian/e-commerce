import { Product } from '@/lib/mockData';
import { SelectedEmiPlan } from '@/lib/emi/types';
import { PersonalizationCartProperty } from '@/lib/personalization/types';
import { ReconciliationNotice } from '@/lib/optimistic/types';

export interface ServerCartLineItem {
  id: string; // Real authoritative server line ID (e.g. "line_oak_table_123")
  productId: string;
  name: string;
  price: number; // Server-confirmed price
  image: string;
  category: string;
  quantity: number;
  selectedVariant?: string;
  selectedEmiPlan?: SelectedEmiPlan;
  personalization?: PersonalizationCartProperty;
  addedAt: string;
  addedPrice: number;
  availableStock?: number;
  isAvailable: boolean;
}

export interface ServerCart {
  id: string;
  userId?: string;
  guestToken?: string;
  version: number; // Incrementing version precondition
  updatedAt: number;
  items: ServerCartLineItem[];
  subtotal: number;
  shipping: number;
  isFreeShipping: boolean;
  total: number;
  appliedCoupon?: {
    code: string;
    discountPercent: number;
    discountAmount: number;
  } | null;
}

export interface CartMutationRequest {
  idempotencyKey: string;
  action: 'add' | 'update_quantity' | 'remove' | 'clear' | 'apply_coupon' | 'remove_coupon';
  userId?: string;
  guestToken?: string;
  versionPrecondition?: number;
  item?: {
    productId: string;
    quantity: number;
    selectedVariant?: string;
    selectedEmiPlan?: SelectedEmiPlan;
    personalization?: PersonalizationCartProperty;
    clientKnownPrice?: number;
    cartId?: string; // Client line ID (temporary or real)
  };
  couponCode?: string;
}

export interface CartMutationResponse {
  success: boolean;
  cart: ServerCart;
  realLineId?: string;
  idempotencyReplayed?: boolean;
  reconciliationNotices: ReconciliationNotice[];
  error?: string;
}
