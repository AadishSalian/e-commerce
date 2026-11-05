import { PanelItem } from '@/components/ui/PanelGallery/types';

/**
 * Curated category configuration for the homepage category showcase.
 * Each entry includes rich descriptions, item counts, focal points, and dominant color placeholders.
 */
export const HOMEPAGE_CATEGORY_PANELS: PanelItem[] = [
  {
    id: 'fashion',
    title: 'Fashion & Apparel',
    description: 'Architectural silhouettes cut from organic cotton and Japanese selvedge denim.',
    itemCount: 142,
    href: '/fashion',
    image: {
      src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop 600w, https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop 1200w',
      width: 1200,
      height: 1600,
      objectPosition: '50% 30%',
      dominantColor: '#1c1b18',
    },
    alt: 'Minimalist designer outerwear and tailored apparel',
  },
  {
    id: 'electronics',
    title: 'Electronics',
    description: 'Matte aluminum desktop tools, acoustic audio drivers, and precision peripherals.',
    itemCount: 68,
    href: '/electronics',
    image: {
      src: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600&auto=format&fit=crop 600w, https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop 800w',
      width: 800,
      height: 1200,
      objectPosition: '50% 40%',
      dominantColor: '#191919',
    },
    alt: 'Modern matte black smartwatch and precision acoustics',
  },
  {
    id: 'home',
    title: 'Home & Furniture',
    description: 'Hand-thrown ceramics, solid white oak tables, and ambient architectural lighting.',
    itemCount: 95,
    href: '/home-furniture',
    image: {
      src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop 600w, https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop 800w',
      width: 800,
      height: 1200,
      objectPosition: 'center 45%',
      dominantColor: '#24211e',
    },
    alt: 'Warm ambient living room with minimalist solid wood furniture',
  },
  {
    id: 'beauty',
    title: 'Beauty Care',
    description: 'Cold-pressed botanical serums and gentle restorative elixirs in frosted glass.',
    itemCount: 54,
    href: '/beauty',
    image: {
      src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop 600w, https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop 800w',
      width: 800,
      height: 1200,
      objectPosition: 'center center',
      dominantColor: '#262220',
    },
    alt: 'Artisanal skincare bottles with organic botanical ingredients',
  },
  {
    id: 'sports',
    title: 'Sports & Outdoors',
    description: 'Ultralight technical outerwear, anodized camp hardware, and trail essentials.',
    itemCount: 82,
    href: '/sports',
    image: {
      src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop 600w, https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop 800w',
      width: 800,
      height: 1200,
      objectPosition: '50% 35%',
      dominantColor: '#171a1c',
    },
    alt: 'Athlete training gear and performance athletic equipment',
  },
  {
    id: 'accessories',
    title: 'Accessories',
    description: 'Vegetable-tanned leather folios, machined brass pens, and daily essentials.',
    itemCount: 110,
    href: '/accessories',
    image: {
      src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop',
      srcset:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop 600w, https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop 1200w',
      width: 1200,
      height: 1600,
      objectPosition: '50% 50%',
      dominantColor: '#21201d',
    },
    alt: 'Premium everyday carry watch and handcrafted leather accessories',
  },
];
