import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, verifyOrderAccess } from '@/lib/order-confirmation/service';
import { formatOrderPlacedDate } from '@/lib/order-confirmation/masking';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const order = getOrderById(id);
    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    const access = verifyOrderAccess(order, { userId, guestToken: token });
    if (!access.allowed) {
      return new NextResponse('Unauthorized access to invoice', { status: 403 });
    }

    const placedDate = formatOrderPlacedDate(order.createdAt, 'en-IN');
    const currency = order.pricing.currency || 'INR';

    const itemsHtml = order.shipments
      .flatMap((s) => s.items)
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">
            <strong>${item.name}</strong>
            ${item.variant ? `<div style="font-size: 12px; color: #666;">${item.variant}</div>` : ''}
            ${item.isPersonalized && item.personalization ? `<div style="font-size: 11px; color: #333;">Engraved: "${item.personalization.inscription}" (${item.personalization.fontName})</div>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.linePrice.toLocaleString('en-IN')}</td>
        </tr>
      `
      )
      .join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Invoice #${order.id} | MATTE.</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #111; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 800; letter-spacing: -1px; }
          .meta { text-align: right; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          th { text-align: left; padding: 10px; border-bottom: 2px solid #111; }
          .totals { width: 300px; margin-left: auto; margin-top: 20px; font-size: 14px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .totals-final { font-size: 18px; font-weight: 700; border-top: 2px solid #111; padding-top: 10px; margin-top: 5px; }
          .footer { margin-top: 60px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">MATTE.</div>
            <div style="font-size: 12px; color: #555; margin-top: 4px;">Precision Engineered Hardware</div>
            <div style="font-size: 12px; color: #777;">GSTIN: ${order.pricing.taxGstNumber || '27AABCU9603R1ZM'}</div>
          </div>
          <div class="meta">
            <h2 style="margin: 0; font-size: 20px;">TAX INVOICE</h2>
            <div><strong>Invoice No:</strong> INV-${order.id}</div>
            <div><strong>Order No:</strong> #${order.id}</div>
            <div><strong>Date:</strong> ${placedDate}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 14px;">
          <div>
            <strong>Billed &amp; Shipped To:</strong><br>
            ${order.customer.firstName} ${order.customer.lastName}<br>
            ${order.customer.shippingAddress.line1}<br>
            ${order.customer.shippingAddress.city}, ${order.customer.shippingAddress.state} - ${order.customer.shippingAddress.zip}<br>
            India
          </div>
          <div style="text-align: right;">
            <strong>Payment Method:</strong><br>
            ${order.payment.methodTitle}<br>
            ${order.payment.maskedDetails}<br>
            Status: Confirmed / Paid
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price (${currency})</th>
              <th style="text-align: right;">Total (${currency})</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal:</span><span>₹${order.pricing.subtotal.toLocaleString('en-IN')}</span></div>
          ${order.pricing.discount > 0 ? `<div class="totals-row" style="color: green;"><span>Discount (${order.pricing.couponCode || 'Promo'}):</span><span>-₹${order.pricing.discount.toLocaleString('en-IN')}</span></div>` : ''}
          ${order.pricing.personalizationFee > 0 ? `<div class="totals-row"><span>Custom Studio Engraving:</span><span>₹${order.pricing.personalizationFee.toLocaleString('en-IN')}</span></div>` : ''}
          <div class="totals-row"><span>Shipping:</span><span>${order.pricing.isShippingFree ? 'Free' : `₹${order.pricing.shipping.toLocaleString('en-IN')}`}</span></div>
          <div class="totals-row"><span>GST (Included):</span><span>₹${order.pricing.taxGst.toLocaleString('en-IN')}</span></div>
          <div class="totals-row totals-final"><span>Total Paid:</span><span>₹${order.pricing.total.toLocaleString('en-IN')}</span></div>
        </div>

        <div class="footer">
          This is a computer-generated invoice. For warranty claims or return assistance, refer to Order #${order.id} or contact support@matte.store.
        </div>
      </body>
      </html>
    `;

    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (err) {
    console.error('API Invoice error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
