import { NextRequest, NextResponse } from 'next/server';
import {
  createOrderNotification,
  createPriceDropNotification,
  createRestockNotification,
  createAccountNotification,
} from '@/lib/notifications/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'usr-demo-1';
    const action = body.action || 'order_update';

    let result = null;

    if (action === 'order_update') {
      result = createOrderNotification({
        userId,
        orderId: body.orderId || 'ORD-948271',
        type: body.type || 'order_out_for_delivery',
        carrier: body.carrier || 'BlueDart Express',
        newEstimate: 'Today before 6 PM',
      });
    } else if (action === 'price_drop') {
      result = createPriceDropNotification({
        userId,
        productId: body.productId || 't-1',
        productName: body.productName || 'Matte Keyboard 1',
        variantId: body.variantId || 'v-1',
        variantValue: body.variantValue || 'Matte Black',
        oldPriceMinor: body.oldPriceMinor || 24900,
        newPriceMinor: body.newPriceMinor || 21900, // another drop
        productImage:
          body.productImage ||
          'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop',
        wishlistName: 'Studio Wishlist',
      });
    } else if (action === 'restock') {
      result = createRestockNotification({
        userId,
        productId: body.productId || 't-3',
        productName: body.productName || 'Aluminum Stand',
        variantValue: 'Space Gray',
        stockCount: 15,
        productImage:
          body.productImage ||
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=400&auto=format&fit=crop',
      });
    } else if (action === 'security_alert') {
      result = createAccountNotification({
        userId,
        type: 'account_new_device',
        device: 'MacBook Air M3',
        browser: 'Firefox 132',
        ipLocation: 'New Delhi, India',
      });
    }

    return NextResponse.json({ success: true, notification: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Simulation failed' },
      { status: 500 }
    );
  }
}
