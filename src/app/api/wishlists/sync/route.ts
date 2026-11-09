import { NextRequest, NextResponse } from 'next/server';
import { syncLocalWishlistsWithUser } from '@/lib/wishlist/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;
    const localWishlists = body.wishlists || [];
    const localItems = body.items || [];

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const result = syncLocalWishlistsWithUser(userId, localWishlists, localItems);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync wishlists' },
      { status: 500 }
    );
  }
}
