export const MOCK_PRODUCTS = [
  // --- TECH & HOME (Expanded) ---
  {
    id: 't-1',
    name: 'Matte Keyboard 1',
    description: 'An ultra-low profile mechanical keyboard machined from a single block of aerospace-grade aluminum. Finished in a soft-touch matte charcoal.',
    price: 249.0,
    category: 'Tech',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800&auto=format&fit=crop',
    variants: [
      { id: 'v-1', name: 'Color', value: 'Matte Black' },
      { id: 'v-2', name: 'Color', value: 'Graphite' },
    ]
  },
  {
    id: 't-2',
    name: 'Ceramic Earbuds',
    description: 'High-fidelity wireless audio encased in a durable, matte-finished ceramic housing. Designed for pristine sound and minimal presence.',
    price: 199.0,
    category: 'Tech',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800&auto=format&fit=crop',
    variants: [
      { id: 'v-3', name: 'Color', value: 'Charcoal' },
      { id: 'v-4', name: 'Color', value: 'Sage' },
    ]
  },
  {
    id: 't-3',
    name: 'Monolith Over-Ears',
    description: 'Studio-grade acoustic engineering wrapped in a brutalist aluminum frame. Features active noise cancellation and 40 hours of battery life.',
    price: 349.0,
    category: 'Tech',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1527443195645-1133f7f28990?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-5', name: 'Color', value: 'Onyx' }
    ]
  },
  {
    id: 't-4',
    name: 'Tactile Smartwatch',
    description: 'A fusion of analog horology and digital intelligence. Features a sapphire glass face, titanium chassis, and discrete haptic feedback.',
    price: 499.0,
    category: 'Tech',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-6', name: 'Color', value: 'Silver' },
      { id: 'v-7', name: 'Color', value: 'Space Gray' }
    ]
  },
  {
    id: 't-5',
    name: 'Studio Monitor Hub',
    description: 'A 27-inch 5K reference display with a perfectly calibrated matte anti-glare finish and integrated ambient backlighting.',
    price: 1299.0,
    category: 'Tech',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-8', name: 'Color', value: 'Pro Black' }
    ]
  },
  {
    id: 't-6',
    name: 'Ergonomic Laser Mouse',
    description: 'Sculpted for the human hand. Features optical switches, an anodized scroll wheel, and a flawless 20,000 DPI sensor.',
    price: 129.0,
    category: 'Tech',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1628202926206-c63a34b19fb4?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'v-9', name: 'Color', value: 'Carbon' },
      { id: 'v-10', name: 'Color', value: 'Chalk' }
    ]
  },
  {
    id: 'p-9',
    name: 'Minimalist Lounge Chair',
    description: 'An ergonomically designed lounge chair with a matte black steel frame and premium soft-touch fabric. Blends seamlessly into any modern living space.',
    price: 899.0,
    category: 'Home & Furniture',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop',
    variants: [
      { id: 'v-12', name: 'Color', value: 'Oatmeal' },
      { id: 'v-13', name: 'Color', value: 'Charcoal' },
    ]
  },
  {
    id: 'h-2',
    name: 'Architectural Floor Lamp',
    description: 'A striking floor lamp featuring a slender, brutalist silhouette and integrated warm-white LEDs. Functions as both sculpture and light source.',
    price: 345.0,
    category: 'Home & Furniture',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop', 
    hoverImage: 'https://images.unsplash.com/photo-1513506003901-1e6a229e9d15?q=80&w=800&auto=format&fit=crop',
    variants: [
      { id: 'hv-1', name: 'Finish', value: 'Matte Black' }
    ]
  },
  {
    id: 'h-3',
    name: 'Monolithic Oak Coffee Table',
    description: 'Crafted from solid European oak and treated with a blackened matte finish. Its robust proportions anchor any seating arrangement.',
    price: 1250.0,
    category: 'Home & Furniture',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?q=80&w=800&auto=format&fit=crop',
    variants: [
      { id: 'hv-2', name: 'Wood', value: 'Black Oak' },
      { id: 'hv-3', name: 'Wood', value: 'Walnut' }
    ]
  },
  {
    id: 'h-4',
    name: 'Textured Ceramic Vase',
    description: 'Hand-thrown stoneware finished with an organic, coarse-textured matte glaze. Beautiful empty, striking when filled.',
    price: 180.0,
    category: 'Home & Furniture',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop',
    variants: [
      { id: 'hv-4', name: 'Color', value: 'Bone' },
      { id: 'hv-5', name: 'Color', value: 'Graphite' }
    ]
  },

  // --- NEW FASHION PRODUCTS (High quality editorial imagery) ---
  {
    id: 'f-1',
    name: 'Oversized Wool Blazer',
    description: 'Tailored from heavy Italian wool with exaggerated proportions. Features a strong shoulder and a drapey, relaxed fit for a dramatic silhouette.',
    price: 395.0,
    category: 'Fashion',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1000&auto=format&fit=crop', 
    hoverImage: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?q=80&w=1000&auto=format&fit=crop', // Fixed
    variants: [
      { id: 'fv-1', name: 'Color', value: 'Onyx' },
      { id: 'fv-2', name: 'Color', value: 'Camel' },
    ]
  },
  {
    id: 'f-2',
    name: 'Silk Slip Dress',
    description: 'A bias-cut masterpiece in 100% heavy mulberry silk. Designed to skim the body with a fluid, liquid-like drape that moves beautifully.',
    price: 245.0,
    category: 'Fashion',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1000&auto=format&fit=crop', // Fixed
    hoverImage: 'https://images.unsplash.com/photo-1611042553365-9b101441c135?q=80&w=1000&auto=format&fit=crop', // Fixed
    variants: [
      { id: 'fv-3', name: 'Color', value: 'Midnight' },
      { id: 'fv-4', name: 'Color', value: 'Pearl' },
    ]
  },
  {
    id: 'f-3',
    name: 'Cashmere Overcoat',
    description: 'The ultimate winter statement piece. Double-faced cashmere blend with exaggerated lapels and a sweeping, ankle-grazing length.',
    price: 850.0,
    category: 'Fashion',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?q=80&w=1000&auto=format&fit=crop', 
    hoverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop', // Fixed
    variants: [
      { id: 'fv-5', name: 'Color', value: 'Charcoal' },
    ]
  },
  {
    id: 'f-4',
    name: 'Wide-Leg Pleated Trousers',
    description: 'High-waisted with deep double pleats. Cut from a fluid crepe fabric that provides movement and a sculptural shape.',
    price: 185.0,
    category: 'Fashion',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop', 
    hoverImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop', // Fixed
    variants: [
      { id: 'fv-6', name: 'Color', value: 'Black' },
      { id: 'fv-7', name: 'Color', value: 'Ivory' },
    ]
  },
  {
    id: 'f-5',
    name: 'Chunky Leather Combat Boots',
    description: 'Handcrafted in Spain from Italian calfskin. Features a pronounced lug sole and minimal hardware for a brutalist, stompy aesthetic.',
    price: 320.0,
    category: 'Fashion',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=1000&auto=format&fit=crop', // Edgy boots
    hoverImage: 'https://images.unsplash.com/photo-1534653299134-96a171b61581?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'fv-8', name: 'Color', value: 'Matte Black' },
    ]
  },
  {
    id: 'f-6',
    name: 'Deconstructed Poplin Shirt',
    description: 'A classic white shirt, reimagined. Features asymmetric buttoning, extended cuffs, and an oversized, crisp silhouette.',
    price: 145.0,
    category: 'Fashion',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop', // Artistic white shirt
    hoverImage: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'fv-9', name: 'Color', value: 'Optic White' },
    ]
  },
  {
    id: 'f-7',
    name: 'Ribbed Knit Turtleneck',
    description: 'Second-skin fit in a stretch merino blend. A foundational layering piece with extra-long sleeves that pool at the wrists.',
    price: 110.0,
    category: 'Fashion',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1611042553365-9b101441c135?q=80&w=1000&auto=format&fit=crop', // Turtleneck fashion
    hoverImage: 'https://images.unsplash.com/photo-1534653299134-96a171b61581?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'fv-10', name: 'Color', value: 'Midnight' },
      { id: 'fv-11', name: 'Color', value: 'Taupe' },
    ]
  },
  {
    id: 'f-8',
    name: 'Structured Leather Tote',
    description: 'Architectural lines carved from vegetable-tanned leather. A monolithic bag that stands on its own and holds your entire life.',
    price: 495.0,
    category: 'Fashion',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop', // Minimalist bag
    hoverImage: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop',
    variants: [
      { id: 'fv-12', name: 'Color', value: 'Black' },
    ]
  },
];

export const CATEGORIES = ['All', 'Tech', 'Accessories', 'Objects', 'Fashion', 'Home & Furniture'];
