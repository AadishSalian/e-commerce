import { NextRequest, NextResponse } from 'next/server';
import {
  createShareLink,
  revokeShareLink,
  rotateShareToken,
} from '@/lib/wishlist/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const userId = body.userId || 'demo-user';
    const action = body.action || 'share';

    if (action === 'revoke') {
      const success = revokeShareLink(id, userId);
      return NextResponse.json({ success, visibility: 'private' });
    }

    if (action === 'rotate') {
      const result = rotateShareToken(id, userId, body.options);
      return NextResponse.json(result);
    }

    const result = createShareLink(id, userId, {
      showOwnerName: !!body.showOwnerName,
      ownerDisplayName: body.ownerDisplayName,
      expirationDays: body.expirationDays || 'never',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update share link' },
      { status: 400 }
    );
  }
}
