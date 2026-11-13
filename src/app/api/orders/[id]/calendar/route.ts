import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, verifyOrderAccess } from '@/lib/order-confirmation/service';
import {
  generateIcsContent,
  generateMultiShipmentIcsContent,
  getCalendarPayloadFromShipment,
} from '@/lib/order-confirmation/calendar';

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
    const isAll = searchParams.get('all') === 'true';
    const sequence = Number(searchParams.get('sequence') || '0');

    const order = getOrderById(id);
    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    const access = verifyOrderAccess(order, { userId, guestToken: token });
    if (!access.allowed) {
      return new NextResponse('Unauthorized access', { status: 403 });
    }

    if (order.shipments.length === 0) {
      return new NextResponse('No shipments available for calendar export', { status: 400 });
    }

    let icsContent: string;
    let filename = `order-${order.id}-delivery.ics`;

    if (isAll && order.shipments.length > 1) {
      const validShipments = order.shipments.filter((s) => s.estimatedDelivery?.start);
      if (validShipments.length === 0) {
        return new NextResponse('No delivery dates available', { status: 400 });
      }
      const payloads = validShipments.map((s) =>
        getCalendarPayloadFromShipment(order.id, s, undefined, sequence)
      );
      icsContent = generateMultiShipmentIcsContent(payloads);
      filename = `order-${order.id}-all-shipments.ics`;
    } else {
      const targetShipment = shipmentId
        ? order.shipments.find((s) => s.id === shipmentId) || order.shipments[0]
        : order.shipments[0];

      if (!targetShipment || !targetShipment.estimatedDelivery?.start) {
        return new NextResponse('No delivery date available', { status: 400 });
      }

      const payload = getCalendarPayloadFromShipment(order.id, targetShipment, undefined, sequence);
      icsContent = generateIcsContent(payload);
      if (targetShipment.totalShipments > 1) {
        filename = `order-${order.id}-shipment-${targetShipment.shipmentNumber}.ics`;
      }
    }

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (err) {
    console.error('API Calendar error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
