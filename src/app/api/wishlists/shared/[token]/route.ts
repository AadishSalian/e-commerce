import { NextRequest, NextResponse } from 'next/server';
import {
  getWishlistByShareToken,
  enrichWishlist,
} from '@/lib/wishlist/service';
import { checkShareRateLimit } from '@/lib/wishlist/tokens';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    // Client IP for rate-limiting
    const ip = request.headers.get('x-forwarded-for') || 'public_visitor';
    if (!checkShareRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const visitorIdentifier = searchParams.get('visitor') || undefined;

    const data = getWishlistByShareToken(token);
    if (!data) {
      // Respond identically for invalid, expired, or revoked tokens to avoid revealing token history
      return NextResponse.json(
        { error: "This list isn't available" },
        {
          status: 404,
          headers: {
            'X-Robots-Tag': 'noindex, nofollow',
          },
        }
      );
    }

    // Shared view enrichment:
    // 1. isSharedView: true -> strips owner's personal "since you saved it" drop badges
    // 2. Surprise protection: visitor sees claims, but owner never does
    const enriched = await enrichWishlist(data.wishlist, data.items, {
      isSharedView: true,
      visitorIdentifier,
      claims: data.claims,
    });

    // Strip owner email or sensitive data if any
    const safeResponse = {
      id: enriched.id,
      name: enriched.name,
      description: enriched.description,
      ownerDisplayName: enriched.shareOptions?.showOwnerName
        ? enriched.shareOptions.ownerDisplayName || 'A shopper'
        : null,
      isGiftList: enriched.isGiftList,
      occasionDate: enriched.occasionDate,
      itemCount: enriched.itemCount,
      items: enriched.items,
      firstFourImages: enriched.firstFourImages,
      createdAt: enriched.createdAt,
      updatedAt: enriched.updatedAt,
    };

    return NextResponse.json(
      { wishlist: safeResponse },
      {
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching shared wishlist:', error);
    return NextResponse.json(
      { error: "This list isn't available" },
      {
        status: 404,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }
}
