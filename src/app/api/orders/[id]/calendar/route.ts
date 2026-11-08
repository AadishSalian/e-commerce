import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, verifyOrderAccess } from '@/lib/order-confirmation/service';
import { generateIcsContent, getCalendarPayloadFromShipment } from '@/lib/order-confirmation/calendar';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const shipmentId = searchParams.get('shipmentId');

    const order = getOrderById(id);
    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    const access = verifyOrderAccess(order, { userId, guestToken: token });
    if (!access.allowed) {
      return new NextResponse('Unauthorized access', { status: 403 });
    }

    const targetShipment = shipmentId
      ? order.shipments.find((s) => s.id === shipmentId) || order.shipments[0]
      : order.shipments[0];

    if (!targetShipment || !targetShipment.estimatedDelivery?.start) {
      return new NextResponse('No delivery date available', { status: 400 });
    }

    const payload = getCalendarPayloadFromShipment(order.id, targetShipment);
    const icsContent = generateIcsContent(payload);

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="order-${order.id}-delivery.ics"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error('API Calendar error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
