import { NextRequest, NextResponse } from 'next/server';
import {
  getWishlistsForUser,
  createWishlist,
  enrichWishlist,
  getWishlistById,
} from '@/lib/wishlist/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const includeItems = searchParams.get('include') === 'items';
    const enriched = searchParams.get('enriched') === 'true';

    const lists = getWishlistsForUser(userId);

    if (!includeItems && !enriched) {
      return NextResponse.json({ wishlists: lists });
    }

    const fullLists = await Promise.all(
      lists.map(async (wl) => {
        const details = getWishlistById(wl.id, userId);
        const items = details?.items || [];
        return enrichWishlist(wl, items);
      })
    );

    return NextResponse.json({ wishlists: fullLists });
  } catch (error: any) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wishlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || 'demo-user';

    const newList = createWishlist(userId, {
      name: body.name,
      description: body.description,
      isDefault: body.isDefault,
      isGiftList: body.isGiftList,
      occasionDate: body.occasionDate,
    });

    return NextResponse.json({ wishlist: newList }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create wishlist' },
      { status: 400 }
    );
  }
}
