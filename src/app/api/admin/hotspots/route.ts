import { NextRequest, NextResponse } from 'next/server';
import {
  getAllHotspots,
  getHotspotsForImage,
  getHotspotsForProduct,
  saveHotspotsForImage,
  deleteHotspot,
} from '@/lib/hotspots/service';
import { validateHotspots } from '@/lib/hotspots/math';
import { Hotspot } from '@/lib/hotspots/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const imageId = searchParams.get('imageId');

    if (imageId) {
      return NextResponse.json({ hotspots: getHotspotsForImage(imageId) });
    }
    if (productId) {
      return NextResponse.json({ hotspots: getHotspotsForProduct(productId) });
    }

    return NextResponse.json({ hotspots: getAllHotspots() });
  } catch (error) {
    console.error('Failed to get hotspots in admin:', error);
    return NextResponse.json({ error: 'Failed to fetch hotspots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, productId, hotspots } = body as {
      imageId: string;
      productId: string;
      hotspots: Hotspot[];
    };

    if (!imageId) {
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 });
    }

    if (!Array.isArray(hotspots)) {
      return NextResponse.json({ error: 'hotspots must be an array' }, { status: 400 });
    }

    const validation = validateHotspots(hotspots);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    const result = saveHotspotsForImage(imageId, productId, hotspots);
    return NextResponse.json({
      success: true,
      hotspots: result.hotspots,
      validation: result.validation,
    });
  } catch (error) {
    console.error('Failed to save hotspots:', error);
    return NextResponse.json({ error: 'Internal server error while saving hotspots' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing hotspot id' }, { status: 400 });
    }

    const deleted = deleteHotspot(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Hotspot not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete hotspot:', error);
    return NextResponse.json({ error: 'Failed to delete hotspot' }, { status: 500 });
  }
}
