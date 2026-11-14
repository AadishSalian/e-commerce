import { NextResponse } from 'next/server';
import { CartService } from '@/lib/cart/service';
import { CartMutationRequest } from '@/lib/cart/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mutations, userId, guestToken } = body;

    if (!Array.isArray(mutations)) {
      return NextResponse.json({ error: 'mutations array is required' }, { status: 400 });
    }

    const requests: CartMutationRequest[] = mutations.map((m: any) => ({
      idempotencyKey: m.idempotencyKey,
      action: m.action === 'cart_add'
        ? 'add'
        : m.action === 'cart_update_quantity'
        ? 'update_quantity'
        : m.action === 'cart_remove'
        ? 'remove'
        : m.action === 'cart_clear'
        ? 'clear'
        : m.action,
      userId: userId || m.payload?.userId,
      guestToken: guestToken || m.payload?.guestToken,
      versionPrecondition: m.versionPrecondition,
      item: m.payload?.item || {
        productId: m.payload?.productId || m.payload?.id,
        quantity: m.payload?.quantity || 1,
        selectedVariant: m.payload?.selectedVariant,
        personalization: m.payload?.personalization,
        selectedEmiPlan: m.payload?.selectedEmiPlan,
        cartId: m.payload?.cartId,
      },
    }));

    const result = CartService.syncOutbox(requests);

    return NextResponse.json({
      success: true,
      cart: result.cart,
      reconciliationNotices: result.notices,
    });
  } catch (error) {
    console.error('Failed to sync outbox', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
