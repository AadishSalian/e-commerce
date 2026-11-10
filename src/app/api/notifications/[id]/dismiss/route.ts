import { NextRequest, NextResponse } from 'next/server';
import { dismissNotification, getUnreadCount, getCategoryCounts } from '@/lib/notifications/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'usr-demo-1';

    const success = dismissNotification(userId, id);
    if (!success) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id,
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
