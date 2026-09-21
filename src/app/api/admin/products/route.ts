import { NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export async function GET() {
  try {
    // We return MOCK_PRODUCTS to match the live catalog used by the rest of the app.
    return NextResponse.json({ products: MOCK_PRODUCTS });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
