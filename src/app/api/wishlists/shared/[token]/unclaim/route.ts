import { NextRequest, NextResponse } from 'next/server';
import { unclaimGiftItem } from '@/lib/wishlist/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();

    const { itemId, claimantIdentifier } = body;
    if (!itemId || !claimantIdentifier) {
      return NextResponse.json(
        { error: 'Item ID and your name or email are required' },
        { status: 400 }
      );
    }

    const success = unclaimGiftItem(token, itemId, claimantIdentifier);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to release claim' },
      { status: 400 }
    );
  }
}
