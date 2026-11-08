import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderById,
  verifyOrderAccess,
  updateOrderShippingAddress,
} from '@/lib/order-confirmation/service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const guestToken = searchParams.get('token') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const order = getOrderById(id);
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

    // Mask sensitive fields if not authenticated owner
    const safeOrder = {
      ...order,
      customer: {
        ...order.customer,
        email: order.customer.maskedEmail,
        phone: order.customer.maskedPhone,
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
