import { NextRequest, NextResponse } from 'next/server';
import { markAllNotificationsRead, getUnreadCount, getCategoryCounts } from '@/lib/notifications/service';
import { NotificationCategory } from '@/lib/notifications/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'usr-demo-1';
    const category = body.category as NotificationCategory | undefined;

    const count = markAllNotificationsRead(userId, category);

    return NextResponse.json({
      success: true,
      markedCount: count,
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
