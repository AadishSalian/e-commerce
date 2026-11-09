import { NextRequest, NextResponse } from 'next/server';
import { addItemToWishlist } from '@/lib/wishlist/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const userId = body.userId || 'demo-user';

    const result = addItemToWishlist(userId, {
      wishlistId: id,
      productId: body.productId,
      variantId: body.variantId,
      note: body.note,
      priority: body.priority,
    });

    return NextResponse.json(result, { status: result.isDuplicate ? 200 : 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add item' },
      { status: 400 }
    );
  }
}
