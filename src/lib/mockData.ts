export const MOCK_PRODUCTS = [
  {
    id: 'p-1',
    name: 'Matte Keyboard 1',
    description: 'An ultra-low profile mechanical keyboard machined from a single block of aerospace-grade aluminum. Finished in a soft-touch matte charcoal.',
    price: 249.0,
    category: 'Tech',
    isNew: true,
    variants: [
      { id: 'v-1', name: 'Color', value: 'Matte Black' },
      { id: 'v-2', name: 'Color', value: 'Graphite' },
    ]
  },
  {
    id: 'p-2',
    name: 'Ceramic Earbuds',
    description: 'High-fidelity wireless audio encased in a durable, matte-finished ceramic housing. Designed for pristine sound and minimal presence.',
    price: 199.0,
    category: 'Tech',
    isNew: false,
    variants: [
      { id: 'v-3', name: 'Color', value: 'Charcoal' },
      { id: 'v-4', name: 'Color', value: 'Sage' },
    ]
  },
  {
    id: 'p-3',
    name: 'Structured Backpack',
    description: 'A minimalist carry solution crafted from weather-resistant matte ballistic nylon. Features padded compartments for all your devices.',
    price: 159.0,
    category: 'Accessories',
    isNew: true,
    variants: []
  },
  {
    id: 'p-4',
    name: 'Desk Pad',
    description: 'A premium vegan leather desk mat that absorbs sound and provides a smooth, non-reflective surface for your workspace.',
    price: 49.0,
    category: 'Objects',
    isNew: false,
    variants: [
      { id: 'v-5', name: 'Color', value: 'Matte Black' },
      { id: 'v-6', name: 'Color', value: 'Warm Gray' },
    ]
  },
  {
    id: 'p-5',
    name: 'Aluminum Monitor Stand',
    description: 'Elevate your display with this seamless aluminum unibody stand. Designed to match the matte aesthetic of your premium devices.',
    price: 89.0,
    category: 'Accessories',
    isNew: false,
    variants: []
  },
  {
    id: 'p-6',
    name: 'Matte Mouse',
    description: 'Ergonomically engineered with a soft-touch finish. Features a silent click mechanism and ultra-precise tracking.',
    price: 99.0,
    category: 'Tech',
    isNew: false,
    variants: [
      { id: 'v-7', name: 'Color', value: 'Matte Black' },
      { id: 'v-8', name: 'Color', value: 'Graphite' },
    ]
  },
  {
    id: 'p-7',
    name: 'Minimalist T-Shirt',
    description: 'A premium heavyweight cotton t-shirt with a relaxed fit. Pre-shrunk and garment dyed for a faded matte look.',
    price: 45.0,
    category: 'Fashion',
    isNew: true,
    variants: [
      { id: 'v-9', name: 'Color', value: 'Washed Black' },
      { id: 'v-10', name: 'Color', value: 'Bone' },
    ]
  },
  {
    id: 'p-8',
    name: 'Everyday Hoodie',
    description: 'Constructed from dense French terry cotton. Features a structured hood and hidden seam pockets for a clean silhouette.',
    price: 85.0,
    category: 'Fashion',
    isNew: false,
    variants: [
      { id: 'v-11', name: 'Color', value: 'Charcoal' },
    ]
  }
];

export const CATEGORIES = ['All', 'Tech', 'Accessories', 'Objects', 'Fashion'];
