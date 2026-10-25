import { NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ products: [], missingIds: [] }, { status: 200 });
    }

    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const productsMap = new Map(MOCK_PRODUCTS.map((p) => [p.id, p]));
    const foundProducts = [];
    const missingIds = [];

    for (const id of ids) {
      const product = productsMap.get(id);
      if (product) {
        foundProducts.push(product);
      } else {
        missingIds.push(id);
      }
    }

    return NextResponse.json(
      {
        products: foundProducts,
        missingIds,
        count: foundProducts.length
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      }
    );
  } catch (error) {
    console.error('Failed to batch fetch products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
