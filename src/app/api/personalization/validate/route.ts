import { NextRequest, NextResponse } from 'next/server';
import { validatePersonalization } from '@/lib/personalization/validation';
import { PersonalizationService } from '@/lib/personalization/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { zone_id, lines, font_id } = body;

    if (!zone_id) {
      return NextResponse.json(
        { isValid: false, message: 'Missing zone_id in validation request' },
        { status: 400 }
      );
    }

    const zone = PersonalizationService.getZoneById(zone_id);
    if (!zone) {
      return NextResponse.json(
        { isValid: false, message: `Zone not found with ID ${zone_id}` },
        { status: 404 }
      );
    }

    const result = validatePersonalization(lines || [], zone);

    // Also verify requested font is valid for this zone
    if (font_id && !zone.fonts.some((f) => f.id === font_id)) {
      result.isValid = false;
      result.issues.push({
        field: 'lines',
        message: 'Selected font is not available for this engraving zone',
        severity: 'error'
      });
    }

    return NextResponse.json({
      isValid: result.isValid,
      sanitizedLines: result.sanitizedLines,
      issues: result.issues,
      price_addon: zone.price_addon,
      lead_time_days: zone.lead_time_days
    });
  } catch (err: any) {
    return NextResponse.json(
      { isValid: false, message: err?.message || 'Server validation error' },
      { status: 500 }
    );
  }
}
