import { NextResponse } from 'next/server';
import { CartService } from '@/lib/cart/service';
import { CartMutationRequest } from '@/lib/cart/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const guestToken = searchParams.get('guestToken') || undefined;

    const cart = CartService.getCart(userId, guestToken);

    // Map to the format CartContext expects, with authoritative fields
    const formattedItems = cart.items.map((item) => ({
      ...item,
      id: item.productId,
      cartId: item.id,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant,
      price: item.price,
      name: item.name,
      image: item.image,
      category: item.category,
      availableStock: item.availableStock,
      isAvailable: item.isAvailable,
      personalization: item.personalization,
      selectedEmiPlan: item.selectedEmiPlan,
    }));

    return NextResponse.json({
      cart,
      items: formattedItems,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      isFreeShipping: cart.isFreeShipping,
      total: cart.total,
      version: cart.version,
    });
  } catch (error) {
    console.error('Failed to fetch cart', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, guestToken, action, item, items, idempotencyKey, versionPrecondition, couponCode } = body;

    // Simulation hooks for testing edge cases
    const simulateHeader = request.headers.get('x-simulate-error');
    if (simulateHeader === '503') {
      return NextResponse.json({ error: 'Simulated backend unavailable' }, { status: 503 });
    }
    if (simulateHeader === '429') {
      return NextResponse.json({ error: 'Simulated rate limit' }, { status: 429 });
    }

    // 1. If explicit mutation request
    if (action) {
      const mutationReq: CartMutationRequest = {
        idempotencyKey: idempotencyKey || `auto_${Date.now()}`,
        action,
        userId,
        guestToken,
        versionPrecondition,
        item,
        couponCode,
      };

      const result = CartService.executeMutation(mutationReq);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result);
    }

    // 2. Legacy bulk replacement endpoint support
    if (items && Array.isArray(items)) {
      CartService.executeMutation({
        idempotencyKey: idempotencyKey || `replace_${Date.now()}`,
        action: 'clear',
        userId,
        guestToken,
      });

      for (const it of items) {
        CartService.executeMutation({
          idempotencyKey: `init_${it.id}_${Date.now()}`,
          action: 'add',
          userId,
          guestToken,
          item: {
            productId: it.id,
            quantity: it.quantity || 1,
            selectedVariant: it.selectedVariant,
            personalization: it.personalization,
            selectedEmiPlan: it.selectedEmiPlan,
          },
        });
      }

      const cart = CartService.getCart(userId, guestToken);
      return NextResponse.json({ success: true, cart });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update cart', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
