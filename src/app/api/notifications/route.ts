import { NextRequest, NextResponse } from 'next/server';
import { getUserNotifications } from '@/lib/notifications/service';
import { NotificationCategory } from '@/lib/notifications/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'usr-demo-1';
    const category = searchParams.get('category') as ('all' | NotificationCategory) || 'all';
    const status = searchParams.get('status') as ('all' | 'unread' | 'read') || 'all';
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = getUserNotifications(userId, {
      category,
      status,
      cursor,
      limit,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, must-revalidate',
        'Vary': 'Cookie, Authorization',
      },
    });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
