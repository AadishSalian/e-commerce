import { NextRequest, NextResponse } from 'next/server';
import {
  removeItemFromWishlist,
  updateWishlistItem,
} from '@/lib/wishlist/service';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const body = await request.json();
    const userId = body.userId || 'demo-user';

    const updated = updateWishlistItem(itemId, userId, {
      note: body.note,
      priority: body.priority,
    });

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const success = removeItemFromWishlist(itemId, userId);
    if (!success) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove item' },
      { status: 400 }
    );
  }
}
