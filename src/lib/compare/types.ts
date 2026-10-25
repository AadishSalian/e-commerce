import { Product } from '@/lib/mockData';

export const MAX_COMPARE_ITEMS = 4;
export const COMPARE_STORAGE_KEY = 'matte_compare_v2';
export const COMPARE_MINIMIZED_KEY = 'matte_compare_minimized';

export interface CompareItem {
  productId: string;
  variantId?: string | null;
  categoryId: string;
  addedAt: number;
}

export type CompareBlockReason =
  | 'limit_reached'
  | 'different_category'
  | 'duplicate'
  | 'not_comparable';

export interface CanAddResult {
  canAdd: boolean;
  reason?: CompareBlockReason;
  existingCategory?: string;
  itemCount: number;
}

export interface PendingCategoryReplacement {
  incomingProduct: {
    id: string;
    name: string;
    category: string;
    image: string;
    price: number;
    variantId?: string | null;
  };
  currentCategory: string;
  newCategory: string;
  currentCount: number;
}

export type AttributeSection =
  | 'overview'
  | 'pricing'
  | 'specifications'
  | 'materials'
  | 'dimensions'
  | 'delivery';

export interface ComparisonAttributeRow {
  key: string;
  label: string;
  section: AttributeSection;
  /** Maps productId -> rendered display value */
  values: Record<string, string | number | null>;
  /** Raw numeric or comparable values for computing best-in-row */
  rawValues?: Record<string, number | null>;
  isDiffering: boolean;
  /** ID of the product with the objectively best value in this row (e.g. lowest price) */
  bestProductId?: string | null;
  unit?: string;
}

export interface ComparisonSection {
  id: AttributeSection;
  title: string;
  rows: ComparisonAttributeRow[];
}

export interface ComparisonTableData {
  products: Product[];
  category: string;
  sections: ComparisonSection[];
  totalAttributesCount: number;
  differingAttributesCount: number;
}

/**
 * Fixed Bottom Stack Coordinator Types
 * Manages layer coordination between mobile bottom tab bar, sticky Add to Bag,
 * cookie/chat widgets, and compare tray.
 */
export interface BottomStackElement {
  id: string;
  height: number;
  priority: number; // Higher number stacks higher
  isMobileOnly?: boolean;
}
