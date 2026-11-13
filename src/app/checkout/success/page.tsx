import { Metadata } from 'next';
import { getOrderById, verifyOrderAccess } from '@/lib/order-confirmation/service';
import { maskShippingAddress } from '@/lib/order-confirmation/masking';
import { OrderConfirmationClient } from '@/components/order-confirmation/OrderConfirmationClient';
import { OrderLookupForm } from '@/components/order-confirmation/OrderLookupForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Order placed | MATTE.',
  description: 'Your order confirmation, delivery schedule, and invoice receipt.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
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

  // If no order ID was provided in the query string (e.g. direct visit after checkout demo),
  // fallback gracefully to our demo seed order with valid token.
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

  // Strictly enforce privacy:
  // Mask street address if accessed by guest token, unmask only for the authenticated owner
  const safeOrder = {
    ...order,
    isOwner: access.isOwner,
    customer: {
      ...order.customer,
      email: order.customer.maskedEmail,
      phone: order.customer.maskedPhone,
      shippingAddress: access.isOwner
        ? order.customer.shippingAddress
        : maskShippingAddress(order.customer.shippingAddress),
    },
  };

  return <OrderConfirmationClient order={safeOrder} />;
}
