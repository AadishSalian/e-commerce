import { NextResponse } from 'next/server';
import { CartService } from '@/lib/cart/service';
import { CartMutationRequest } from '@/lib/cart/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      productId,
      quantity = 1,
      selectedVariant,
      personalization,
      selectedEmiPlan,
      clientKnownPrice,
      idempotencyKey,
      userId,
      guestToken,
      versionPrecondition,
    } = body;

    // Simulation hooks for testing edge cases
    const simulateHeader = request.headers.get('x-simulate-error');
    if (simulateHeader === '503') {
      return NextResponse.json(
        { error: 'Simulated temporary server error', retryable: true },
        { status: 503 }
      );
    }
    if (simulateHeader === '429') {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.', retryable: false },
        { status: 429 }
      );
    }
    if (simulateHeader === 'delay') {
      await new Promise((res) => setTimeout(res, 3500));
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const mutationReq: CartMutationRequest = {
      idempotencyKey: idempotencyKey || `item_${Date.now()}`,
      action: 'add',
      userId,
      guestToken,
      versionPrecondition,
      item: {
        productId,
        quantity,
        selectedVariant,
        personalization,
        selectedEmiPlan,
        clientKnownPrice,
      },
    };

    const result = CartService.executeMutation(mutationReq);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to add item to cart', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
