import { NextRequest, NextResponse } from 'next/server';
import { reorderWishlistItems } from '@/lib/wishlist/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const userId = body.userId || 'demo-user';
    const itemIds = body.itemIds || [];

    const success = reorderWishlistItems(id, userId, itemIds);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reorder items' },
      { status: 400 }
    );
  }
}
