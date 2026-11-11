/**
 * Payment and Card Brand Type Definitions
 * Strict PCI-DSS SAQ A compliant data structures.
 * Raw PAN, CVC, and Expiry are NEVER stored or transmitted through our application state.
 */

export type CardBrandId =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'rupay'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay';

export type ExtendedCardBrandId = CardBrandId | 'unknown';

export type SecurityCodeLabel = 'CVV' | 'CVC' | 'CID' | 'CVN';
export type SecurityCodeLocation = 'back' | 'front';

export interface CardBrandDefinition {
  id: CardBrandId;
  name: string;
  shortName: string;
  securityCodeName: SecurityCodeLabel;
  securityCodeLength: 3 | 4;
  securityCodeLocation: SecurityCodeLocation;
  securityCodeHelper: string;
  lengths: readonly number[];
  grouping: readonly number[];
  placeholder: string;
  officialDocUrl: string;
}

export interface CardBrandDetectionResult {
  brand: ExtendedCardBrandId;
  isAmbiguous: boolean;
  possibleBrands: CardBrandId[];
  isComplete: boolean;
  meta: CardBrandDefinition | null;
  coBadgedOptions?: CardBrandId[];
}

/**
 * Event emitted by the secure hosted/iframe field.
 * In accordance with PCI-DSS SAQ A, the field value is NOT exposed in the event payload.
 */
export interface SecureFieldChangeEvent {
  elementType: 'cardNumber' | 'cardExpiry' | 'cardCvc';
  brand?: ExtendedCardBrandId;
  complete: boolean;
  empty: boolean;
  error?: {
    message: string;
    code?: string;
  };
  possibleCoBadgedBrands?: CardBrandId[];
}

/**
 * Nonce/Token response returned by the payment gateway vault.
 */
export interface VaultTokenResult {
  token: string;
  card: {
    brand: CardBrandId;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingAddress?: {
    country?: string;
    postalCode?: string;
  };
}

/**
 * Merchant acceptance configuration
 */
export interface MerchantPaymentConfig {
  acceptedBrands: readonly CardBrandId[];
  require3DSecure: boolean;
  supportCoBadgedSelection: boolean;
  gatewayProvider: 'stripe' | 'razorpay' | 'mock_sandbox';
}
