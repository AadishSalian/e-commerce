import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationService } from '@/lib/personalization/service';
import { generateProductionAssetSpec } from '@/lib/personalization/production';
import { PersonalizationCartProperty } from '@/lib/personalization/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { property, productId, variantId } = body as {
      property: PersonalizationCartProperty;
      productId: string;
      variantId?: string;
    };

    if (!property || !property.zone_id) {
      return NextResponse.json(
        { error: 'Missing personalization property or zone_id' },
        { status: 400 }
      );
    }

    const zone = PersonalizationService.getZoneById(property.zone_id);
    if (!zone) {
      return NextResponse.json(
        { error: `Zone not found with ID ${property.zone_id}` },
        { status: 404 }
      );
    }

    const spec = generateProductionAssetSpec(
      property,
      zone,
      productId || zone.productId,
      variantId
    );

    return NextResponse.json(spec);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate production specification' },
      { status: 500 }
    );
  }
}
