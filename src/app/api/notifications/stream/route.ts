import { NextRequest } from 'next/server';
import { subscribeUserEvents, getUnreadCount, getCategoryCounts } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'usr-demo-1';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial unread state
      const initialPayload = {
        unreadCount: getUnreadCount(userId),
        categoryCounts: getCategoryCounts(userId),
        timestamp: new Date().toISOString(),
      };
      controller.enqueue(
        encoder.encode(`event: initial\ndata: ${JSON.stringify(initialPayload)}\n\n`)
      );

      // 2. Subscribe to user notification events
      const unsubscribe = subscribeUserEvents(userId, (event) => {
        try {
          const chunk = `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch (err) {
          // If stream closed, clean up
        }
      });

      // 3. Heartbeat every 25 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (err) {
          clearInterval(pingInterval);
        }
      }, 25000);

      // 4. Handle connection abort / close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform, private',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
