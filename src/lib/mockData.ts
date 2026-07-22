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
    attributes: { techCategory: ['Workspace'], productType: 'Peripherals', feature: 'Wireless' },
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
    attributes: { techCategory: ['Audio', 'Wearables'], productType: 'Earbuds', feature: 'Noise Cancelling' },
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
    attributes: { techCategory: ['Audio'], productType: 'Headphones', feature: 'Noise Cancelling' },
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
    attributes: { techCategory: ['Wearables'], productType: 'Accessories', feature: 'Ergonomic' },
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
    attributes: { techCategory: ['Workspace'], productType: 'Displays', feature: 'High-Res' },
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
    image: 'https://images.unsplash.com/photo-1527443195645-1133f7f28990?q=80&w=1000&auto=format&fit=crop',
    attributes: { techCategory: ['Workspace'], productType: 'Peripherals', feature: 'Ergonomic' },
    variants: [
      { id: 'v-9', name: 'Color', value: 'Carbon' },
      { id: 'v-10', name: 'Color', value: 'Chalk' }
    ]
  },
  {
    id: 't-7',
    name: 'Compact Mirrorless Camera',
    description: 'A full-frame sensor housed in a minimal, weatherproof magnesium body. Designed for uncompromising street and travel photography.',
    price: 1499.0,
    category: 'Tech',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?q=80&w=1000&auto=format&fit=crop',
    attributes: { techCategory: ['Photography'], productType: 'Cameras', feature: 'High-Res' },
    variants: [
      { id: 'tv-11', name: 'Color', value: 'Silver/Black' }
    ]
  },
  {
    id: 't-8',
    name: 'Smart Climate Thermostat',
    description: 'An ambient intelligent thermostat with a machined aluminum dial and an e-ink display. Blends seamlessly into any wall.',
    price: 249.0,
    category: 'Tech',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=1000&auto=format&fit=crop',
    attributes: { techCategory: ['Smart Home'], productType: 'Accessories', feature: 'Wireless' },
    variants: [
      { id: 'tv-12', name: 'Color', value: 'Brushed Aluminum' }
    ]
  },
  {
    id: 't-9',
    name: 'Nomad Portable Speaker',
    description: 'A rugged, IP67-rated wireless speaker wrapped in acoustic fabric. Delivers 360-degree sound and 24 hours of playback.',
    price: 179.0,
    category: 'Tech',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1000&auto=format&fit=crop',
    attributes: { techCategory: ['Audio', 'Smart Home'], productType: 'Accessories', feature: 'Wireless' },
    variants: [
      { id: 'tv-13', name: 'Color', value: 'Midnight' },
      { id: 'tv-14', name: 'Color', value: 'Sand' }
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
    attributes: { room: ['Living Room', 'Bedroom'], productType: 'Chairs', style: 'Minimalist' },
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
    hoverImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop',
    attributes: { room: ['Living Room', 'Office', 'Bedroom'], productType: 'Lighting', style: 'Modern' },
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
    attributes: { room: ['Living Room'], productType: 'Tables', style: 'Modern' },
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
    attributes: { room: ['Living Room', 'Dining', 'Bedroom'], productType: 'Storage', style: 'Minimalist' },
    variants: [
      { id: 'hv-4', name: 'Color', value: 'Bone' },
      { id: 'hv-5', name: 'Color', value: 'Graphite' }
    ]
  },
  {
    id: 'h-5',
    name: 'Solid Walnut Dining Table',
    description: 'A masterpiece of joinery. Seats 8 comfortably around a deeply figured solid walnut top supported by tapered brass-capped legs.',
    price: 2200.0,
    category: 'Home & Furniture',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=800&auto=format&fit=crop',
    attributes: { room: ['Dining'], productType: 'Tables', style: 'Traditional' },
    variants: [
      { id: 'hv-6', name: 'Wood', value: 'Walnut' }
    ]
  },
  {
    id: 'h-6',
    name: 'Floating Platform Bed',
    description: 'Creates the illusion of weightlessness. A solid ash frame with hidden supports and integrated bedside surfaces.',
    price: 1850.0,
    category: 'Home & Furniture',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=800&auto=format&fit=crop',
    attributes: { room: ['Bedroom'], productType: 'Beds', style: 'Minimalist' },
    variants: [
      { id: 'hv-7', name: 'Size', value: 'Queen' },
      { id: 'hv-8', name: 'Size', value: 'King' }
    ]
  },
  {
    id: 'h-7',
    name: 'Industrial Drafting Desk',
    description: 'A heavy-duty workspace featuring a raw steel frame and a distressed reclaimed wood top. Height adjustable via cast-iron hand crank.',
    price: 1100.0,
    category: 'Home & Furniture',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop',
    attributes: { room: ['Office'], productType: 'Tables', style: 'Industrial' },
    variants: [
      { id: 'hv-9', name: 'Finish', value: 'Raw Steel' }
    ]
  },
  {
    id: 'h-8',
    name: 'Woven Outdoor Lounge',
    description: 'Weather-resistant teak meets performance cord weaving. Designed for ultimate relaxation on the patio or poolside.',
    price: 650.0,
    category: 'Home & Furniture',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?q=80&w=800&auto=format&fit=crop',
    attributes: { room: ['Outdoor'], productType: 'Chairs', style: 'Modern' },
    variants: [
      { id: 'hv-10', name: 'Color', value: 'Sand' }
    ]
  },
  {
    id: 'h-9',
    name: 'Modular Bookshelf Unit',
    description: 'Endlessly configurable powder-coated steel shelving. Can serve as a room divider or a wall-mounted library.',
    price: 890.0,
    category: 'Home & Furniture',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=800&auto=format&fit=crop',
    attributes: { room: ['Living Room', 'Office'], productType: 'Storage', style: 'Industrial' },
    variants: [
      { id: 'hv-11', name: 'Color', value: 'Matte White' },
      { id: 'hv-12', name: 'Color', value: 'Jet Black' }
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
  // --- BEAUTY & PERSONAL CARE ---
  {
    id: 'b-1',
    name: 'Purifying Clay Cleanser',
    description: 'A deep-cleansing clay formula that removes impurities without stripping moisture. Leaves skin feeling balanced and matte.',
    price: 38.0,
    category: 'Beauty',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop',
    attributes: { beautyCategory: ['Skincare'], productType: 'Cleansers', formulation: 'Natural' },
    variants: []
  },
  {
    id: 'b-2',
    name: 'Midnight Recovery Serum',
    description: 'An intensive overnight repair oil formulated with squalane and evening primrose. Restores radiance by morning.',
    price: 85.0,
    category: 'Beauty',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
    attributes: { beautyCategory: ['Skincare'], productType: 'Serums', formulation: 'Hydrating' },
    variants: []
  },
  {
    id: 'b-3',
    name: 'Sandalwood & Vetiver Eau de Parfum',
    description: 'A deeply grounding, unisex fragrance. Smoky vetiver meets creamy sandalwood and cracked black pepper.',
    price: 145.0,
    category: 'Beauty',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
    attributes: { beautyCategory: ['Fragrance'], productType: 'Perfume', formulation: 'Vegan' },
    variants: []
  },
  {
    id: 'b-4',
    name: 'Machined Safety Razor',
    description: 'A perfectly weighted, single-blade safety razor milled from solid brass. An heirloom tool for a plastic-free shave.',
    price: 65.0,
    category: 'Beauty',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?q=80&w=800&auto=format&fit=crop',
    attributes: { beautyCategory: ['Grooming'], productType: 'Tools', formulation: 'Natural' },
    variants: []
  },
  {
    id: 'b-5',
    name: 'Exfoliating Body Polish',
    description: 'Crushed walnut shells and volcanic ash blend to gently resurface the skin. Scented with eucalyptus and cedar.',
    price: 42.0,
    category: 'Beauty',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800&auto=format&fit=crop',
    attributes: { beautyCategory: ['Bath & Body'], productType: 'Cleansers', formulation: 'Natural' },
    variants: []
  },
  {
    id: 'b-6',
    name: 'Daily Shield Moisturizer',
    description: 'A lightweight, invisible gel-cream that locks in hydration while defending against environmental stressors.',
    price: 54.0,
    category: 'Beauty',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
    attributes: { beautyCategory: ['Skincare'], productType: 'Moisturizers', formulation: 'Fragrance-Free' },
    variants: []
  },
  {
    id: 'b-7',
    name: 'Hinoki Bath Soak',
    description: 'Mineral-rich sea salts infused with Japanese cypress. Transforms your bathtub into a forest hot spring.',
    price: 36.0,
    category: 'Beauty',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=800&auto=format&fit=crop',
    attributes: { beautyCategory: ['Bath & Body'], productType: 'Tools', formulation: 'Vegan' },
    variants: []
  },
  {
    id: 'b-8',
    name: 'Matte Styling Clay',
    description: 'Provides flexible hold and a completely matte finish. Washes out easily and nourishes the scalp.',
    price: 28.0,
    category: 'Beauty',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=800&auto=format&fit=crop',
    attributes: { beautyCategory: ['Grooming'], productType: 'Moisturizers', formulation: 'Natural' },
    variants: []
  },
  // --- SPORTS & OUTDOORS ---
  {
    id: 's-1',
    name: 'Carbon Fiber Tennis Racket',
    description: 'Ultra-lightweight carbon fiber frame with custom string tension. Designed for aggressive baseliners.',
    price: 250.0,
    category: 'Sports & Outdoors',
    isNew: true,
    image: '/sports/tennis.png',
    hoverImage: '/sports/tennis.png',
    attributes: { activity: ['Training'], gearType: 'Equipment', environment: 'Indoor' },
    variants: []
  },
  {
    id: 's-2',
    name: 'Alpine Climbing Harness',
    description: 'Minimalist alpine harness. Features dynamic load distribution and extreme weather resistance.',
    price: 135.0,
    category: 'Sports & Outdoors',
    isNew: false,
    image: '/sports/harness.png',
    attributes: { activity: ['Outdoor'], gearType: 'Equipment', environment: 'Alpine' },
    variants: []
  },
  {
    id: 's-3',
    name: 'Merino Wool Base Layer',
    description: 'Thermoregulating merino wool top. Naturally odor-resistant and designed for high-output mountain pursuits.',
    price: 95.0,
    category: 'Sports & Outdoors',
    isNew: true,
    image: '/sports/shirt.png',
    attributes: { activity: ['Outdoor', 'Travel'], gearType: 'Apparel', environment: 'Alpine' },
    variants: []
  },
  {
    id: 's-4',
    name: 'Percussion Massage Gun',
    description: 'Professional-grade deep tissue percussion therapy device with 5 interchangeable heads.',
    price: 299.0,
    category: 'Sports & Outdoors',
    isNew: false,
    image: '/sports/gun.png',
    attributes: { activity: ['Recovery'], gearType: 'Accessories', environment: 'Indoor' },
    variants: []
  },
  {
    id: 's-5',
    name: 'Ultralight Hiking Pack',
    description: 'Dyneema composite fabric 40L pack weighing just 1.5lbs. Waterproof and virtually indestructible.',
    price: 320.0,
    category: 'Sports & Outdoors',
    isNew: false,
    image: '/sports/pack.png',
    attributes: { activity: ['Outdoor', 'Travel'], gearType: 'Equipment', environment: 'All-Weather' },
    variants: []
  },
  {
    id: 's-6',
    name: 'High-Grip Yoga Mat',
    description: 'Natural rubber mat with alignment markers. Engineered to maintain grip even in the sweatiest sessions.',
    price: 85.0,
    category: 'Sports & Outdoors',
    isNew: true,
    image: '/sports/mat.png',
    attributes: { activity: ['Training'], gearType: 'Equipment', environment: 'Studio' },
    variants: []
  },
  {
    id: 's-7',
    name: 'Trail Running Shoes',
    description: 'Aggressive lug pattern with a carbon plate for propulsion on uneven terrain.',
    price: 180.0,
    category: 'Sports & Outdoors',
    isNew: false,
    image: '/sports/shoes.png',
    attributes: { activity: ['Outdoor', 'Training'], gearType: 'Apparel', environment: 'All-Weather' },
    variants: []
  },
  {
    id: 's-8',
    name: 'Compression Recovery Boots',
    description: 'Pneumatic compression system that boosts circulation and accelerates recovery after intense workouts.',
    price: 799.0,
    category: 'Sports & Outdoors',
    isNew: false,
    image: '/sports/boots.png',
    attributes: { activity: ['Recovery'], gearType: 'Equipment', environment: 'Indoor' },
    variants: []
  }
];

export const CATEGORIES = ['All', 'Tech', 'Accessories', 'Objects', 'Fashion', 'Home & Furniture', 'Beauty', 'Sports & Outdoors'];
