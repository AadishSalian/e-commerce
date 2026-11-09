import { NextRequest, NextResponse } from 'next/server';
import { undoDeleteWishlist } from '@/lib/wishlist/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'demo-user';

    const restored = undoDeleteWishlist(id, userId);
    return NextResponse.json({ wishlist: restored });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to restore wishlist' },
      { status: 400 }
    );
  }
}
