export type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-8942-XL',
    date: '2026-07-25',
    status: 'shipped',
    total: 395.0,
    shippingAddress: '123 Design Avenue, Apt 4B, New York, NY 10001',
    paymentMethod: 'Visa ending in 4242',
    trackingNumber: '1Z9999999999999999',
    carrier: 'UPS',
    estimatedDelivery: '2026-07-31',
    items: [
      {
        id: 'item-1',
        productId: 'f-1',
        name: 'Oversized Wool Blazer',
        price: 395.0,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=400&auto=format&fit=crop',
        variant: 'Onyx'
      }
    ]
  },
  {
    id: 'ORD-7721-MC',
    date: '2026-06-12',
    status: 'delivered',
    total: 249.0,
    shippingAddress: '123 Design Avenue, Apt 4B, New York, NY 10001',
    paymentMethod: 'Apple Pay',
    trackingNumber: 'TBA123456789000',
    carrier: 'AMZL',
    items: [
      {
        id: 'item-2',
        productId: 't-1',
        name: 'Matte Keyboard 1',
        price: 249.0,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop',
        variant: 'Matte Black'
      }
    ]
  },
  {
    id: 'ORD-6510-AB',
    date: '2026-07-28',
    status: 'processing',
    total: 85.0,
    shippingAddress: '123 Design Avenue, Apt 4B, New York, NY 10001',
    paymentMethod: 'Mastercard ending in 1111',
    items: [
      {
        id: 'item-3',
        productId: 'b-2',
        name: 'Midnight Recovery Serum',
        price: 85.0,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop',
      }
    ]
  }
];
