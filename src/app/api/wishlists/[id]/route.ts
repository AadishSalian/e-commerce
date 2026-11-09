import { NextRequest, NextResponse } from 'next/server';
import {
  getWishlistById,
  updateWishlist,
  softDeleteWishlist,
  enrichWishlist,
} from '@/lib/wishlist/service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const details = getWishlistById(id, userId);
    if (!details) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    const enriched = await enrichWishlist(details.wishlist, details.items);
    return NextResponse.json({ wishlist: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const userId = body.userId || 'demo-user';

    const updated = updateWishlist(id, userId, body);
    return NextResponse.json({ wishlist: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update wishlist' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const result = softDeleteWishlist(id, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete wishlist' },
      { status: 400 }
    );
  }
}
