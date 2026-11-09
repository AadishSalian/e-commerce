import { NextRequest, NextResponse } from 'next/server';
import { claimGiftItem } from '@/lib/wishlist/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();

    const { itemId, name, email } = body;
    if (!itemId || !name) {
      return NextResponse.json(
        { error: 'Item ID and your name are required' },
        { status: 400 }
      );
    }

    const result = claimGiftItem(token, itemId, { name, email });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to claim item' },
      { status: 400 }
    );
  }
}
