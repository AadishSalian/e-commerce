import { NextRequest, NextResponse } from 'next/server';
import { markNotificationRead, markNotificationUnread, getUnreadCount, getCategoryCounts } from '@/lib/notifications/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'usr-demo-1';
    const isRead = body.read !== false; // default true

    let success = false;
    if (isRead) {
      success = markNotificationRead(userId, id);
    } else {
      success = markNotificationUnread(userId, id);
    }

    if (!success) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id,
      read: isRead,
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
