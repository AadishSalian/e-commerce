import { Product } from '@/lib/mockData';
import { ListingState } from './types';

/**
 * Filters and sorts products consistently based on typed ListingState.
 */
export function applyListingFilters(products: Product[], state: ListingState): Product[] {
  const qClean = state.q ? state.q.toLowerCase().trim() : '';

  const filtered = products.filter((p) => {
    // 1. Category
    if (state.category && state.category !== 'All') {
      const catMatch =
        p.category.toLowerCase() === state.category.toLowerCase() ||
        p.category.toLowerCase().includes(state.category.toLowerCase());
      if (!catMatch) return false;
    }

    // 2. Search Query (q)
    if (qClean) {
      const inName = p.name.toLowerCase().includes(qClean);
      const inDesc = p.description.toLowerCase().includes(qClean);
      const inCat = p.category.toLowerCase().includes(qClean);
      if (!inName && !inDesc && !inCat) return false;
    }

    // 3. Material
    if (state.material && state.material.length > 0) {
      const matAttrs = p.attributes?.material;
      const matList = Array.isArray(matAttrs)
        ? matAttrs.map((m) => m.toLowerCase())
        : matAttrs
        ? [matAttrs.toLowerCase()]
        : [];

      const descLower = p.description.toLowerCase();
      const nameLower = p.name.toLowerCase();

      const hasMaterial = state.material.some((m) => {
        const mLow = m.toLowerCase();
        return matList.includes(mLow) || descLower.includes(mLow) || nameLower.includes(mLow);
      });

      if (!hasMaterial) return false;
    }

    // 4. Brand
    if (state.brand && state.brand.length > 0) {
      const brandAttr = p.attributes?.brand;
      const brandList = Array.isArray(brandAttr)
        ? brandAttr.map((b) => b.toLowerCase())
        : brandAttr
        ? [brandAttr.toLowerCase()]
        : [];

      const descLower = p.description.toLowerCase();
      const nameLower = p.name.toLowerCase();

      const hasBrand = state.brand.some((b) => {
        const bLow = b.toLowerCase();
        return brandList.includes(bLow) || descLower.includes(bLow) || nameLower.includes(bLow);
      });

      if (!hasBrand) return false;
    }

    // 5. Color
    if (state.color && state.color.length > 0) {
      const variantColors = (p.variants || [])
        .filter((v) => !v.name || v.name.toLowerCase() === 'color')
        .map((v) => v.value.toLowerCase());

      const colorAttr = p.attributes?.color;
      if (colorAttr) {
        if (Array.isArray(colorAttr)) {
          variantColors.push(...colorAttr.map((c) => c.toLowerCase()));
        } else {
          variantColors.push(colorAttr.toLowerCase());
        }
      }

      const hasColor = state.color.some((c) => {
        const cLow = c.toLowerCase();
        return variantColors.some((vc) => vc.includes(cLow));
      });

      if (!hasColor) return false;
    }

    // 6. Size
    if (state.size && state.size.length > 0) {
      const sizeAttr = p.attributes?.size;
      const sizeList = Array.isArray(sizeAttr)
        ? sizeAttr.map((s) => s.toLowerCase())
        : sizeAttr
        ? [sizeAttr.toLowerCase()]
        : [];

      const hasSize = state.size.some((s) => sizeList.includes(s.toLowerCase()));
      if (!hasSize) return false;
    }

    // 7. Price Range
    if (state.minPrice !== null && p.price < state.minPrice) return false;
    if (state.maxPrice !== null && p.price > state.maxPrice) return false;

    // 8. Rating
    if (state.rating !== null) {
      const itemRating = p.rating || 4.5;
      if (itemRating < state.rating) return false;
    }

    // 9. In Stock Only
    if (state.inStock === true) {
      if (p.stockCount !== undefined && p.stockCount <= 0) return false;
    }

    return true;
  });

  // Sorting
  return filtered.sort((a, b) => {
    switch (state.sort) {
      case 'price-asc':
      case 'price-low':
        return a.price - b.price;
      case 'price-desc':
      case 'price-high':
        return b.price - a.price;
      case 'rating':
      case 'rating-desc':
        return (b.rating || 4.5) - (a.rating || 4.5);
      case 'newest':
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      case 'relevance':
      default:
        if (qClean) {
          const aExact = a.name.toLowerCase().includes(qClean) ? 2 : 1;
          const bExact = b.name.toLowerCase().includes(qClean) ? 2 : 1;
          return bExact - aExact;
        }
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    }
  });
}
