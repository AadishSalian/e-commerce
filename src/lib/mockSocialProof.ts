export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number; // 1-5
  date: string;
  content: string;
  verifiedPurchase: boolean;
  photos?: string[];
}

export interface QnA {
  id: string;
  productId: string;
  question: string;
  answer?: string;
  asker: string;
  responder?: string;
  date: string;
}

// Generate some random metrics for live activity
export function getLiveActivityMetrics(productId: string) {
  // Use product id length to generate a somewhat consistent random number per product
  const seed = productId.length;
  
  const viewers = Math.max(3, Math.floor(Math.random() * (seed * 5)) + 2);
  const purchasedToday = Math.max(1, Math.floor(Math.random() * (seed * 2)));
  
  return {
    viewers,
    purchasedToday,
  };
}

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r-1',
    productId: 't-1',
    author: 'Alex Morgan',
    rating: 5,
    date: '2023-11-15',
    content: 'Absolutely incredible keyboard. The matte finish is stunning and it sounds completely silent. Setup was a breeze with my Mac.',
    verifiedPurchase: true,
    photos: [
      'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop',
    ],
  },
  {
    id: 'r-2',
    productId: 't-1',
    author: 'Sarah Chen',
    rating: 4,
    date: '2023-11-02',
    content: 'Love the typing feel and the build quality is top-notch. Only giving it 4 stars because the software is slightly clunky, but once set up, it\'s perfect.',
    verifiedPurchase: true,
  },
  {
    id: 'r-3',
    productId: 't-1',
    author: 'David L.',
    rating: 5,
    date: '2023-10-28',
    content: 'Best purchase for my home office this year.',
    verifiedPurchase: false,
  },
  // Furniture example with photo
  {
    id: 'r-4',
    productId: 'h-3', // Monolithic Oak Coffee Table
    author: 'Emma Wilson',
    rating: 5,
    date: '2023-12-01',
    content: 'This table anchors my living room perfectly. The black oak finish is deeply textured and looks way more expensive than it is. Highly recommend!',
    verifiedPurchase: true,
    photos: [
      'https://images.unsplash.com/photo-1532372320572-cda25653a26d?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=400&auto=format&fit=crop'
    ],
  },
];

export const MOCK_QNA: QnA[] = [
  {
    id: 'q-1',
    productId: 't-1',
    question: 'Does this keyboard work with Windows and Mac seamlessly?',
    answer: 'Yes! It includes a physical switch on the back to instantly swap between Windows and Mac layouts, and comes with extra keycaps for both.',
    asker: 'Jordan P.',
    responder: 'Store Team',
    date: '2023-10-12',
  },
  {
    id: 'q-2',
    productId: 't-1',
    question: 'How long does the battery last with the backlight on?',
    answer: 'With the backlight on medium brightness, you can expect around 14 days of battery life. With it off, it lasts up to 6 months.',
    asker: 'Michael T.',
    responder: 'Store Team',
    date: '2023-11-05',
  },
  {
    id: 'q-3',
    productId: 'h-3',
    question: 'Is the black oak finish susceptible to water rings?',
    answer: 'The table is treated with a durable matte polyurethane finish that resists water rings, but we still highly recommend using coasters for hot or wet drinks.',
    asker: 'Sophia M.',
    responder: 'Store Team',
    date: '2023-11-20',
  }
];

export function getProductReviews(productId: string): Review[] {
  // Return matching reviews or generate some fake ones based on ID for demo purposes
  const matches = MOCK_REVIEWS.filter(r => r.productId === productId);
  if (matches.length > 0) return matches;
  
  // Generate generic reviews if none exist in mock data
  return [
    {
      id: `gen-r-1-${productId}`,
      productId,
      author: 'Verified Buyer',
      rating: 5,
      date: '2024-01-15',
      content: 'Excellent quality and fast shipping. Completely exceeded my expectations.',
      verifiedPurchase: true,
    },
    {
      id: `gen-r-2-${productId}`,
      productId,
      author: 'Happy Customer',
      rating: 4,
      date: '2023-12-10',
      content: 'Really great product, though the packaging was slightly damaged in transit. The item itself is perfect.',
      verifiedPurchase: true,
    }
  ];
}

export function getProductQnA(productId: string): QnA[] {
  const matches = MOCK_QNA.filter(q => q.productId === productId);
  if (matches.length > 0) return matches;
  
  // Return an empty array if no QnA exists to encourage users to ask the first question
  return [];
}
