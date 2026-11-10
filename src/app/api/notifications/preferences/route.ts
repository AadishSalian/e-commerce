import { NextRequest, NextResponse } from 'next/server';
import { getUserPreferences, updateUserPreferences } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'usr-demo-1';

    const prefs = getUserPreferences(userId);
    return NextResponse.json(prefs, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'usr-demo-1';

    const updated = updateUserPreferences(userId, body);
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
