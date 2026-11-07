import { SplitHalfConfig } from '@/components/ui/SplitHero/types';

/**
 * Editorial Women / Men split preset.
 * Curated for minimalist architecture, structured silhouettes, and tactile matte finishes.
 */
export const WOMEN_MEN_SPLIT_HERO: [SplitHalfConfig, SplitHalfConfig] = [
  {
    id: 'women',
    label: 'Women',
    descriptor: 'Architectural tailoring, sculptural wools, and quiet forms.',
    href: '/products?category=women',
    cta: 'Shop women',
    image: {
      src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop 800w, https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop 1200w, https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop 1600w',
      width: 1600,
      height: 2200,
      objectPosition: '50% 25%',
      alt: 'Model in structured minimal yellow coat and architectural sunglasses',
      placeholderColor: '#1a1816',
    },
    quickLinks: [
      { label: 'New in', href: '/products?category=women&filter=new' },
      { label: 'Outerwear', href: '/products?category=women&filter=outerwear' },
      { label: 'Best sellers', href: '/products?category=women&filter=bestsellers' },
    ],
  },
  {
    id: 'men',
    label: 'Men',
    descriptor: 'Engineered outerwear, heavyweight cotton, and clean lines.',
    href: '/products?category=men',
    cta: 'Shop men',
    image: {
      src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop 800w, https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop 1200w, https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop 1600w',
      width: 1600,
      height: 2200,
      objectPosition: '50% 20%',
      alt: 'Model in tailored black wool suit against minimalist urban backdrop',
      placeholderColor: '#121214',
    },
    quickLinks: [
      { label: 'New in', href: '/products?category=men&filter=new' },
      { label: 'Tailoring', href: '/products?category=men&filter=tailoring' },
      { label: 'Sale', href: '/products?category=men&filter=sale' },
    ],
  },
];

/**
 * Editorial Fashion / Home split preset.
 */
export const FASHION_HOME_SPLIT_HERO: [SplitHalfConfig, SplitHalfConfig] = [
  {
    id: 'fashion',
    label: 'Fashion',
    descriptor: 'Garments crafted from organic cotton and Japanese denim.',
    href: '/fashion',
    cta: 'Explore fashion',
    image: {
      src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop 800w, https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop 1600w',
      width: 1600,
      height: 2000,
      objectPosition: '50% 30%',
      alt: 'Minimalist designer outerwear and tailored apparel',
      placeholderColor: '#1c1b18',
    },
    quickLinks: [
      { label: 'New in', href: '/fashion?filter=new' },
      { label: 'Apparel', href: '/fashion?filter=apparel' },
      { label: 'Accessories', href: '/accessories' },
    ],
  },
  {
    id: 'home',
    label: 'Home',
    descriptor: 'Solid white oak tables, hand ceramics, and ambient lighting.',
    href: '/home-furniture',
    cta: 'Explore home',
    image: {
      src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop 800w, https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop 1600w',
      width: 1600,
      height: 2000,
      objectPosition: 'center 45%',
      alt: 'Warm ambient living room with minimalist solid wood furniture',
      placeholderColor: '#24211e',
    },
    quickLinks: [
      { label: 'Furniture', href: '/home-furniture?filter=furniture' },
      { label: 'Lighting', href: '/home-furniture?filter=lighting' },
      { label: 'Ceramics', href: '/home-furniture?filter=ceramics' },
    ],
  },
];

/**
 * Editorial New Arrivals / Archive split preset.
 */
export const NEW_ARCHIVE_SPLIT_HERO: [SplitHalfConfig, SplitHalfConfig] = [
  {
    id: 'new',
    label: 'New in',
    descriptor: 'The latest batch of precision hardware and seasonal apparel.',
    href: '/products?category=new',
    cta: 'Shop new arrivals',
    image: {
      src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1600&auto=format&fit=crop',
      width: 1600,
      height: 2000,
      objectPosition: 'center center',
      alt: 'Matte hardware and precision timepiece',
      placeholderColor: '#17191b',
    },
    quickLinks: [
      { label: 'This week', href: '/products?category=new&filter=week' },
      { label: 'Limited runs', href: '/products?category=new&filter=limited' },
    ],
  },
  {
    id: 'archive',
    label: 'Archive',
    descriptor: 'Past season silhouettes and foundational hardware releases.',
    href: '/products?category=archive',
    cta: 'Explore archive',
    image: {
      src: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1600&auto=format&fit=crop',
      width: 1600,
      height: 2000,
      objectPosition: '50% 40%',
      alt: 'Classic matte anodized tech hardware',
      placeholderColor: '#181819',
    },
    quickLinks: [
      { label: 'Permanent collection', href: '/products?category=permanent' },
      { label: 'Final call', href: '/products?sale=true' },
    ],
  },
];

export const DEFAULT_SPLIT_HERO_HALVES = WOMEN_MEN_SPLIT_HERO;
