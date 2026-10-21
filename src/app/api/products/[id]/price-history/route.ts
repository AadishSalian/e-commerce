import { NextResponse } from 'next/server';
import { getProductPriceHistory } from '@/lib/price-history/service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const variantId = searchParams.get('variantId') || null;

    const history = getProductPriceHistory(id, variantId, daysParam);

    if (!history) {
      return NextResponse.json(
        { error: 'No price history recorded for this product' },
        { status: 404 }
      );
    }

    // Cache briefly (1 minute edge cache, 2 minutes stale-while-revalidate)
    return NextResponse.json(history, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Failed to retrieve price history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
