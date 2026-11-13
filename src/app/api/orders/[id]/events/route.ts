import { NextRequest } from 'next/server';
import { getOrderById, verifyOrderAccess } from '@/lib/order-confirmation/service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || undefined;
  const userId = searchParams.get('userId') || undefined;

  const order = getOrderById(id);
  if (!order) {
    return new Response('Order not found', { status: 404 });
  }

  const access = verifyOrderAccess(order, { userId, guestToken: token });
  if (!access.allowed) {
    return new Response('Unauthorized', { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial status
      const initialPayload = JSON.stringify({
        status: order.status,
        updatedAt: order.updatedAt,
      });
      controller.enqueue(encoder.encode(`event: status\ndata: ${initialPayload}\n\n`));

      // Keep connection alive with periodic check or heartbeat
      let counter = 0;
      const interval = setInterval(() => {
        counter++;
        const currentOrder = getOrderById(id);
        if (!currentOrder) {
          clearInterval(interval);
          controller.close();
          return;
        }

        const data = JSON.stringify({
          status: currentOrder.status,
          updatedAt: currentOrder.updatedAt,
        });
        controller.enqueue(encoder.encode(`event: status\ndata: ${data}\n\n`));

        // If status changed from pending to confirmed, or after 10 ticks, close
        if (currentOrder.status !== 'payment_pending' || counter >= 10) {
          clearInterval(interval);
          controller.close();
        }
      }, 3000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
