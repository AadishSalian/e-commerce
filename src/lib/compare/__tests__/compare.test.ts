import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useCompareStore } from '../../../store/useCompareStore';
import { useBottomStackStore } from '../bottomStack';
import { buildComparisonTableData } from '../tableData';
import { Product } from '@/lib/mockData';
import { MAX_COMPARE_ITEMS } from '../types';

// Mock products for testing
const mockTechProductA: Product = {
  id: 'tech_1',
  name: 'Titanium Mechanical Keyboard',
  description: 'Precision engineered mechanical keyboard with custom tuned linear switches.',
  category: 'Tech',
  isNew: true,
  price: 249.0,
  image: '/images/products/keyboard.jpg',
  rating: 4.9,
  reviewCount: 120,
  attributes: {
    Connectivity: 'Bluetooth 5.3 + 2.4GHz',
    Battery: '4000mAh',
    Material: 'Grade 5 Titanium'
  }
};

const mockTechProductB: Product = {
  id: 'tech_2',
  name: 'Carbon Precision Mouse',
  description: 'Ultra-lightweight carbon composite wireless mouse.',
  category: 'Tech',
  isNew: false,
  price: 129.0,
  image: '/images/products/mouse.jpg',
  rating: 4.7,
  reviewCount: 88,
  attributes: {
    Connectivity: 'Bluetooth 5.3 + 2.4GHz',
    Battery: '1200mAh',
    Material: 'Molded Carbon Fiber'
  }
};

const mockTechProductC: Product = {
  id: 'tech_3',
  name: 'Desk Pad Mat',
  description: 'Micro-textured wool felt and vegan suede desk mat.',
  category: 'Tech',
  isNew: false,
  price: 69.0,
  image: '/images/products/mat.jpg',
  rating: 4.6,
  reviewCount: 45
};

const mockTechProductD: Product = {
  id: 'tech_4',
  name: 'Monitor Light Bar',
  description: 'Asymmetric optical monitor light bar with auto-dimming sensor.',
  category: 'Tech',
  isNew: false,
  price: 99.0,
  image: '/images/products/light.jpg',
  rating: 4.8,
  reviewCount: 60
};

const mockTechProductE: Product = {
  id: 'tech_5',
  name: 'External SSD',
  description: 'Rugged aluminum external solid-state drive.',
  category: 'Tech',
  isNew: false,
  price: 189.0,
  image: '/images/products/ssd.jpg',
  rating: 4.9,
  reviewCount: 30
};

const mockLivingProduct: Product = {
  id: 'living_1',
  name: 'Walnut Lounge Chair',
  description: 'Sculptural lounge chair crafted from solid American walnut.',
  category: 'Home & Living',
  isNew: true,
  price: 899.0,
  image: '/images/products/chair.jpg',
  rating: 4.9,
  reviewCount: 15
};

const mockGiftCard: Product = {
  id: 'gift_card_1',
  name: 'Matte Digital Gift Card',
  description: 'Delivered digitally for custom engraved bespoke items.',
  category: 'Gift Cards',
  isNew: false,
  price: 100.0,
  image: '/images/products/giftcard.jpg',
  rating: 5.0,
  reviewCount: 10
};

describe('Compare Store: Rules and Limits', () => {
  beforeEach(() => {
    useCompareStore.getState().clear();
  });

  it('adds items successfully and tracks active category', () => {
    const store = useCompareStore.getState();
    const res = store.add(mockTechProductA);

    assert.equal(res.success, true);
    assert.equal(useCompareStore.getState().items.length, 1);
    assert.equal(useCompareStore.getState().activeCategory, 'Tech');
    assert.equal(useCompareStore.getState().has('tech_1'), true);
  });

  it('enforces maximum 4 items limit (MAX_COMPARE_ITEMS)', () => {
    const store = useCompareStore.getState();
    store.add(mockTechProductA);
    store.add(mockTechProductB);
    store.add(mockTechProductC);
    store.add(mockTechProductD);

    assert.equal(useCompareStore.getState().items.length, 4);
    assert.equal(useCompareStore.getState().isFull(), true);

    const fifthAdd = useCompareStore.getState().canAdd(mockTechProductE);
    assert.equal(fifthAdd.canAdd, false);
    assert.equal(fifthAdd.reason, 'limit_reached');

    const res = useCompareStore.getState().add(mockTechProductE);
    assert.equal(res.success, false);
    assert.equal(res.reason, 'limit_reached');
    assert.equal(useCompareStore.getState().items.length, 4);
  });

  it('rejects duplicate products and triggers highlight', () => {
    const store = useCompareStore.getState();
    store.add(mockTechProductA);

    const dupCheck = store.canAdd(mockTechProductA);
    assert.equal(dupCheck.canAdd, false);
    assert.equal(dupCheck.reason, 'duplicate');

    const res = store.add(mockTechProductA);
    assert.equal(res.success, false);
    assert.equal(res.reason, 'duplicate');
    assert.equal(useCompareStore.getState().highlightedId, 'tech_1');
  });

  it('enforces same-category rule and initiates replacement prompt', () => {
    const store = useCompareStore.getState();
    store.add(mockTechProductA); // Category: 'Tech'

    // Try adding Home & Living product
    const check = store.canAdd(mockLivingProduct);
    assert.equal(check.canAdd, false);
    assert.equal(check.reason, 'different_category');
    assert.equal(check.existingCategory, 'Tech');

    const res = store.add(mockLivingProduct);
    assert.equal(res.success, false);
    assert.equal(res.reason, 'different_category');

    // Store holds pending replacement
    const pending = useCompareStore.getState().pendingReplacement;
    assert.ok(pending);
    assert.equal(pending?.currentCategory, 'Tech');
    assert.equal(pending?.newCategory, 'Home & Living');
    assert.equal(pending?.incomingProduct.id, 'living_1');
  });

  it('confirms category replacement cleanly', () => {
    const store = useCompareStore.getState();
    store.add(mockTechProductA);
    store.add(mockTechProductB);
    assert.equal(useCompareStore.getState().items.length, 2);

    store.requestCategoryReplacement(mockLivingProduct);
    store.confirmCategoryReplacement();

    const state = useCompareStore.getState();
    assert.equal(state.items.length, 1);
    assert.equal(state.items[0].productId, 'living_1');
    assert.equal(state.activeCategory, 'Home & Living');
    assert.equal(state.pendingReplacement, null);
  });

  it('cancels category replacement without modifying existing items', () => {
    const store = useCompareStore.getState();
    store.add(mockTechProductA);
    store.requestCategoryReplacement(mockLivingProduct);
    store.cancelCategoryReplacement();

    const state = useCompareStore.getState();
    assert.equal(state.items.length, 1);
    assert.equal(state.items[0].productId, 'tech_1');
    assert.equal(state.activeCategory, 'Tech');
    assert.equal(state.pendingReplacement, null);
  });

  it('disallows non-comparable items such as Gift Cards', () => {
    const store = useCompareStore.getState();
    const check = store.canAdd(mockGiftCard);
    assert.equal(check.canAdd, false);
    assert.equal(check.reason, 'not_comparable');
  });

  it('removes items and updates active category on empty', () => {
    const store = useCompareStore.getState();
    store.add(mockTechProductA);
    store.remove('tech_1');

    assert.equal(useCompareStore.getState().items.length, 0);
    assert.equal(useCompareStore.getState().activeCategory, null);
  });
});

describe('Fixed Bottom Stack Coordinator', () => {
  it('registers and unregisters elements', () => {
    const stack = useBottomStackStore.getState();
    stack.registerElement('cookie-banner', 48, false);

    const mobileOffset = stack.getBottomOffset(true);
    const desktopOffset = stack.getBottomOffset(false);

    // Mobile includes 64px bottom-nav + 48px banner = 112
    assert.equal(mobileOffset, 112);
    // Desktop only includes 48px banner = 48
    assert.equal(desktopOffset, 48);

    stack.unregisterElement('cookie-banner');
    assert.equal(stack.getBottomOffset(false), 0);
  });

  it('tracks sticky Add to Bag visibility', () => {
    const stack = useBottomStackStore.getState();
    stack.setStickyAddToCartVisible(true);
    assert.equal(useBottomStackStore.getState().isStickyAddToCartVisible, true);
    stack.setStickyAddToCartVisible(false);
    assert.equal(useBottomStackStore.getState().isStickyAddToCartVisible, false);
  });
});

describe('Comparison Table Data Generation', () => {
  it('returns empty structure when products array is empty', () => {
    const data = buildComparisonTableData([]);
    assert.equal(data.products.length, 0);
    assert.equal(data.sections.length, 0);
  });

  it('builds sections, detects differing attributes, and identifies best values', () => {
    const data = buildComparisonTableData([mockTechProductA, mockTechProductB]);

    assert.equal(data.products.length, 2);
    assert.equal(data.category, 'Tech');
    assert.ok(data.sections.length >= 4);

    // Pricing row check
    const pricingSection = data.sections.find((s) => s.id === 'pricing')!;
    assert.ok(pricingSection);
    const priceRow = pricingSection.rows.find((r) => r.key === 'price')!;
    assert.ok(priceRow);

    // Price differs ($249 vs $129)
    assert.equal(priceRow.isDiffering, true);
    // Best value for price is 'lower' -> mockTechProductB ($129)
    assert.equal(priceRow.bestProductId, 'tech_2');

    // Specifications row check
    const specSection = data.sections.find((s) => s.id === 'specifications')!;
    assert.ok(specSection);
    const connectivityRow = specSection.rows.find((r) => r.label.toLowerCase().includes('connectivity'))!;
    assert.ok(connectivityRow);
    // Both share "Bluetooth 5.3 + 2.4GHz" so isDiffering should be false
    assert.equal(connectivityRow.isDiffering, false);

    // Rating row check
    const overviewSection = data.sections.find((s) => s.id === 'overview')!;
    const ratingRow = overviewSection.rows.find((r) => r.key === 'rating')!;
    assert.ok(ratingRow);
    // Best value for rating is 'higher' -> mockTechProductA (4.9 vs 4.7)
    assert.equal(ratingRow.bestProductId, 'tech_1');
  });

  it('gracefully handles missing attributes by returning null for em dash rendering', () => {
    // mockTechProductC does not have attributes.Connectivity
    const data = buildComparisonTableData([mockTechProductA, mockTechProductC]);
    const specSection = data.sections.find((s) => s.id === 'specifications')!;
    const connectivityRow = specSection.rows.find((r) => r.label.toLowerCase().includes('connectivity'))!;

    assert.equal(connectivityRow.values['tech_1'], 'Bluetooth 5.3 + 2.4GHz');
    assert.equal(connectivityRow.values['tech_3'], null);
    assert.equal(connectivityRow.isDiffering, true);
  });
});
