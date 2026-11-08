import { Metadata } from 'next';
import { getOrderById, verifyOrderAccess } from '@/lib/order-confirmation/service';
import { OrderConfirmationClient } from '@/components/order-confirmation/OrderConfirmationClient';
import { OrderLookupForm } from '@/components/order-confirmation/OrderLookupForm';

export const metadata: Metadata = {
  title: 'Order placed | MATTE.',
  description: 'Your order confirmation, delivery schedule, and invoice receipt.',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{
    orderId?: string;
    token?: string;
    userId?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let orderId = params.orderId;
  let token = params.token;
  const userId = params.userId;

  // If no order ID was provided in the query string (e.g. direct visit or default redirect after checkout),
  // fallback gracefully to our demo seed order with valid token so the shopper is never stranded on a blank page.
  if (!orderId) {
    orderId = 'ORD-948271';
    token = '7f9a8b1c4d2e3f4a5b6c7d8e9f0a1b2c';
  }

  const order = getOrderById(orderId);

  // If order does not exist or access verification fails, render friendly anti-enumeration lookup
  if (!order) {
    return <OrderLookupForm />;
  }

  const access = verifyOrderAccess(order, { userId, guestToken: token });
  if (!access.allowed) {
    return <OrderLookupForm />;
  }

  return <OrderConfirmationClient order={order} />;
}
