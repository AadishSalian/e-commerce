import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderById,
  getAllOrders,
  saveAllOrders,
  verifyOrderAccess,
  updateOrderShippingAddress,
} from '@/lib/order-confirmation/service';
import { maskShippingAddress } from '@/lib/order-confirmation/masking';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const guestToken = searchParams.get('token') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const simulate = searchParams.get('simulate');

    let order = getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const access = verifyOrderAccess(order, { userId, guestToken });
    if (!access.allowed) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: access.reason },
        { status: 403 }
      );
    }

    // Simulate webhook landing for pending orders
    if (order.status === 'payment_pending' && simulate === 'confirm') {
      const all = getAllOrders();
      const updated = all.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status: 'confirmed' as const,
            payment: {
              ...o.payment,
              status: 'confirmed' as const,
              transactionId: `TXN-UPI-${Date.now()}`,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      });
      saveAllOrders(updated);
      order = getOrderById(id)!;
    }

    // Mask sensitive fields if not authenticated owner
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

    return NextResponse.json(
      { order: safeOrder },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  } catch (err) {
    console.error('API /api/orders/[id] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const guestToken = body?.token;
    const userId = body?.userId;

    if (body?.shippingAddress) {
      const result = updateOrderShippingAddress(id, body.shippingAddress, {
        userId,
        guestToken,
      });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
  } catch (err) {
    console.error('API /api/orders/[id] PATCH error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
