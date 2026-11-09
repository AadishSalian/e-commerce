import { NextRequest, NextResponse } from 'next/server';
import { moveOrCopyItems } from '@/lib/wishlist/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceWishlistId } = await context.params;
    const body = await request.json();
    const userId = body.userId || 'demo-user';
    const { targetWishlistId, itemIds, action } = body;

    if (!targetWishlistId || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid targetWishlistId or itemIds' },
        { status: 400 }
      );
    }

    const result = moveOrCopyItems(
      sourceWishlistId,
      targetWishlistId,
      itemIds,
      action === 'copy' ? 'copy' : 'move',
      userId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to move or copy items' },
      { status: 400 }
    );
  }
}
