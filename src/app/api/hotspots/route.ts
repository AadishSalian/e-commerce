import { NextRequest, NextResponse } from 'next/server';
import { getHotspotsForImage, getHotspotsForProduct } from '@/lib/hotspots/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const imageId = searchParams.get('imageId');
    const variantId = searchParams.get('variantId') || undefined;

    if (imageId) {
      const hotspots = getHotspotsForImage(imageId, variantId);
      return NextResponse.json({ hotspots });
    }

    if (productId) {
      const hotspots = getHotspotsForProduct(productId, variantId);
      return NextResponse.json({ hotspots });
    }

    return NextResponse.json({ error: 'Missing productId or imageId query parameter' }, { status: 400 });
  } catch (error) {
    console.error('Failed to get hotspots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
