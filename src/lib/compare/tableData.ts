import { Product } from '@/lib/mockData';
import { PersonalizationService } from '@/lib/personalization/service';
import {
  ComparisonTableData,
  ComparisonSection,
  ComparisonAttributeRow,
  AttributeSection
} from './types';

/**
 * Builds structured comparison table data grouped by sections,
 * computes whether each attribute differs across products,
 * and identifies objective best values (e.g. lowest price, highest rating).
 */
export function buildComparisonTableData(products: Product[]): ComparisonTableData {
  if (!products || products.length === 0) {
    return {
      products: [],
      category: '',
      sections: [],
      totalAttributesCount: 0,
      differingAttributesCount: 0
    };
  }

  const category = products[0].category || 'Products';

  // 1. OVERVIEW SECTION
  const overviewRows: ComparisonAttributeRow[] = [
    createRow({
      key: 'rating',
      label: 'Shopper Rating',
      section: 'overview',
      products,
      getValue: (p) => (p.rating ? `${p.rating} / 5.0` : '4.8 / 5.0'),
      getRawValue: (p) => p.rating || 4.8,
      better: 'higher'
    }),
    createRow({
      key: 'reviews',
      label: 'Customer Reviews',
      section: 'overview',
      products,
      getValue: (p) => (p.reviewCount ? `${p.reviewCount} verified reviews` : '24 verified reviews'),
      getRawValue: (p) => p.reviewCount || 24,
      better: 'higher'
    }),
    createRow({
      key: 'tier',
      label: 'Build Tier',
      section: 'overview',
      products,
      getValue: (p) => p.tier || 'Standard'
    }),
    createRow({
      key: 'stock',
      label: 'Availability',
      section: 'overview',
      products,
      getValue: (p) => (p.stockCount && p.stockCount > 0 ? `In Stock (${p.stockCount} units)` : 'In Stock')
    })
  ];

  // 2. PRICING SECTION
  const pricingRows: ComparisonAttributeRow[] = [
    createRow({
      key: 'price',
      label: 'Base Price',
      section: 'pricing',
      products,
      getValue: (p) => `$${p.price.toFixed(2)}`,
      getRawValue: (p) => p.price,
      better: 'lower'
    }),
    createRow({
      key: 'personalization',
      label: 'Personalization',
      section: 'pricing',
      products,
      getValue: (p) => (PersonalizationService.getZonesForProduct(p.id).length > 0 ? 'Laser / Deboss Available' : 'Standard Edition')
    }),
    createRow({
      key: 'emi',
      label: 'Flexible Financing',
      section: 'pricing',
      products,
      getValue: (p) => (p.price >= 50 ? `From $${(p.price / 3).toFixed(2)}/mo (0% APR)` : 'Full payment only')
    })
  ];

  // 3. SPECIFICATIONS SECTION (Dynamically gathered from product.attributes)
  const allSpecKeys = new Set<string>();
  for (const p of products) {
    if (p.attributes) {
      Object.keys(p.attributes).forEach((k) => allSpecKeys.add(k));
    }
  }

  const specRows: ComparisonAttributeRow[] = Array.from(allSpecKeys).map((attrKey) => {
    return createRow({
      key: `spec_${attrKey}`,
      label: formatAttributeLabel(attrKey),
      section: 'specifications',
      products,
      getValue: (p) => {
        const val = p.attributes?.[attrKey];
        return val ? String(val) : null;
      }
    });
  });

  // 4. MATERIALS & CRAFTSMANSHIP
  const materialRows: ComparisonAttributeRow[] = [
    createRow({
      key: 'materials',
      label: 'Primary Material',
      section: 'materials',
      products,
      getValue: (p) => {
        if (p.attributes?.['Material']) return String(p.attributes['Material']);
        if (p.category === 'Tech') return 'Anodized 6000-series Aluminum & Ceramic';
        if (p.category === 'Home & Living' || p.category === 'Furniture') return 'Solid American Walnut & Powder-coated Steel';
        if (p.category === 'Accessories') return 'Full-grain Horween Leather & PVD Brass';
        return 'Matte Engineered Polymer';
      }
    }),
    createRow({
      key: 'finish',
      label: 'Surface Finish',
      section: 'materials',
      products,
      getValue: (p) => {
        if (p.attributes?.['Finish']) return String(p.attributes['Finish']);
        return 'Bead-blasted Matte finish';
      }
    }),
    createRow({
      key: 'variants_count',
      label: 'Colorways',
      section: 'materials',
      products,
      getValue: (p) => (p.variants && p.variants.length > 0 ? `${p.variants.length} colorways` : '1 colorway'),
      getRawValue: (p) => (p.variants ? p.variants.length : 1),
      better: 'higher'
    })
  ];

  // 5. DIMENSIONS & WEIGHT
  const dimensionRows: ComparisonAttributeRow[] = [
    createRow({
      key: 'dimensions',
      label: 'Dimensions',
      section: 'dimensions',
      products,
      getValue: (p) => {
        if (p.attributes?.['Dimensions']) return String(p.attributes['Dimensions']);
        if (p.attributes?.['Size']) return String(p.attributes['Size']);
        return null;
      }
    }),
    createRow({
      key: 'weight',
      label: 'Weight',
      section: 'dimensions',
      products,
      getValue: (p) => {
        if (p.attributes?.['Weight']) return String(p.attributes['Weight']);
        return null;
      }
    })
  ];

  // 6. DELIVERY & WARRANTY
  const deliveryRows: ComparisonAttributeRow[] = [
    createRow({
      key: 'shipping',
      label: 'Shipping',
      section: 'delivery',
      products,
      getValue: (p) => (p.price >= 150 ? 'Free Express 2-Day Shipping' : 'Standard Shipping ($8.00)'),
      getRawValue: (p) => (p.price >= 150 ? 0 : 8),
      better: 'lower'
    }),
    createRow({
      key: 'returns',
      label: 'Return Policy',
      section: 'delivery',
      products,
      getValue: (p) =>
        PersonalizationService.getZonesForProduct(p.id).length > 0
          ? 'Standard: 30 days / Custom: Made-to-order'
          : '30-Day Hassle-free Returns'
    }),
    createRow({
      key: 'warranty',
      label: 'Warranty',
      section: 'delivery',
      products,
      getValue: (p) => {
        if (p.attributes?.['Warranty']) return String(p.attributes['Warranty']);
        return '2-Year Limited Manufacturer Warranty';
      }
    })
  ];

  const sections: ComparisonSection[] = [
    { id: 'overview', title: 'Overview & Ratings', rows: overviewRows },
    { id: 'pricing', title: 'Pricing & Value', rows: pricingRows },
    ...(specRows.length > 0 ? [{ id: 'specifications' as AttributeSection, title: 'Technical Specifications', rows: specRows }] : []),
    { id: 'materials', title: 'Materials & Craftsmanship', rows: materialRows },
    { id: 'dimensions', title: 'Dimensions & Weight', rows: dimensionRows },
    { id: 'delivery', title: 'Shipping & Warranty', rows: deliveryRows }
  ];

  let totalAttributesCount = 0;
  let differingAttributesCount = 0;

  for (const s of sections) {
    for (const r of s.rows) {
      totalAttributesCount++;
      if (r.isDiffering) {
        differingAttributesCount++;
      }
    }
  }

  return {
    products,
    category,
    sections,
    totalAttributesCount,
    differingAttributesCount
  };
}

interface CreateRowConfig {
  key: string;
  label: string;
  section: AttributeSection;
  products: Product[];
  getValue: (p: Product) => string | number | null;
  getRawValue?: (p: Product) => number | null;
  better?: 'lower' | 'higher';
}

function createRow({
  key,
  label,
  section,
  products,
  getValue,
  getRawValue,
  better
}: CreateRowConfig): ComparisonAttributeRow {
  const values: Record<string, string | number | null> = {};
  const rawValues: Record<string, number | null> = {};

  const distinctValues = new Set<string | null>();

  for (const p of products) {
    const val = getValue(p);
    values[p.id] = val;
    if (val !== null && val !== undefined) {
      distinctValues.add(String(val).trim().toLowerCase());
    } else {
      distinctValues.add(null);
    }

    if (getRawValue) {
      rawValues[p.id] = getRawValue(p);
    }
  }

  // Row differs if more than 1 distinct value (including null) exists across products
  const isDiffering = distinctValues.size > 1;

  // Objective best value calculation
  let bestProductId: string | null = null;
  if (better && getRawValue && products.length >= 2) {
    let bestVal = better === 'lower' ? Infinity : -Infinity;
    let bestId: string | null = null;
    let hasTie = false;

    for (const p of products) {
      const raw = rawValues[p.id];
      if (raw !== null && raw !== undefined) {
        if (better === 'lower') {
          if (raw < bestVal) {
            bestVal = raw;
            bestId = p.id;
            hasTie = false;
          } else if (raw === bestVal) {
            hasTie = true;
          }
        } else {
          if (raw > bestVal) {
            bestVal = raw;
            bestId = p.id;
            hasTie = false;
          } else if (raw === bestVal) {
            hasTie = true;
          }
        }
      }
    }

    // Only set bestProductId if there's no tie across all products
    if (bestId && !hasTie) {
      bestProductId = bestId;
    }
  }

  return {
    key,
    label,
    section,
    values,
    rawValues,
    isDiffering,
    bestProductId
  };
}

function formatAttributeLabel(key: string): string {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
