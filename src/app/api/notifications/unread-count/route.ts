import { NextRequest, NextResponse } from 'next/server';
import { getUnreadCount, getCategoryCounts } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'usr-demo-1';

    const unreadCount = getUnreadCount(userId);
    const categoryCounts = getCategoryCounts(userId);

    return NextResponse.json(
      { unreadCount, categoryCounts },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
