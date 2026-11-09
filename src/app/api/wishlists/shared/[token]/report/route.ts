import { NextRequest, NextResponse } from 'next/server';
import { reportWishlist } from '@/lib/wishlist/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();

    const success = reportWishlist(token, body.reason || 'Reported by visitor');
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit report' },
      { status: 400 }
    );
  }
}
