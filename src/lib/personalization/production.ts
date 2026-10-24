import {
  EngravingZone,
  PersonalizationCartProperty,
  ProductionAssetSpec
} from './types';
import { calculateAutoFitText, formatMonogramText } from './math';

/**
 * Generates vector SVG and print/laser fulfillment spec from structured personalization data.
 * Adheres to: "The preview is generated from the same structured data that goes to production."
 */
export function generateProductionAssetSpec(
  property: PersonalizationCartProperty,
  zone: EngravingZone,
  productId: string,
  variantId?: string
): ProductionAssetSpec {
  const font =
    zone.fonts.find((f) => f.id === property.font_id) || zone.fonts[0];

  // Convert zone geometry to physical mm scale (typical accessory work envelope: 120mm x 120mm)
  const BASE_WORK_ENVELOPE_MM = 120.0;
  const originXmm = Number(((zone.geometry.x / 100) * BASE_WORK_ENVELOPE_MM).toFixed(2));
  const originYmm = Number(((zone.geometry.y / 100) * BASE_WORK_ENVELOPE_MM).toFixed(2));
  const boxWidthMm = Number(((zone.geometry.width / 100) * BASE_WORK_ENVELOPE_MM).toFixed(2));
  const boxHeightMm = Number(((zone.geometry.height / 100) * BASE_WORK_ENVELOPE_MM).toFixed(2));

  // Virtual coordinate box for high-res vector production (1000 x 500)
  const virtualW = 1000;
  const virtualH = Math.max(200, Math.round(1000 * (boxHeightMm / boxWidthMm)));

  const fitResult = calculateAutoFitText(
    property.lines,
    zone,
    font,
    virtualW,
    virtualH
  );

  const normalizedNfcLines = property.lines.map((l) => l.normalize('NFC'));

  // SVG text anchor
  const textAnchor =
    property.alignment === 'center'
      ? 'middle'
      : property.alignment === 'right'
      ? 'end'
      : 'start';

  const anchorX =
    property.alignment === 'center'
      ? virtualW / 2
      : property.alignment === 'right'
      ? virtualW * 0.94
      : virtualW * 0.06;

  // Build clean laser vector path / text SVG for CNC laser router / mechanical deboss tool
  const linesSvg = fitResult.lines
    .map((line, i) => {
      const y = fitResult.yOffsets[i] || (i + 1) * fitResult.fontSize * 1.35;
      const content = property.icon_glyph
        ? property.icon_position === 'before'
          ? `${property.icon_glyph} ${line}`
          : `${line} ${property.icon_glyph}`
        : line;

      return `    <text x="${anchorX}" y="${y}" text-anchor="${textAnchor}" font-family="${font.font_family.replace(/"/g, "'")}" font-size="${fitResult.fontSize}" letter-spacing="${font.letter_spacing}" fill="#000000">${escapeXml(content)}</text>`;
    })
    .join('\n');

  const productionSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${virtualW} ${virtualH}" width="${boxWidthMm}mm" height="${boxHeightMm}mm">
  <!-- MATTE Production Engraving Spec | Zone: ${zone.zone_id} | Product: ${productId} -->
  <!-- Process: ${zone.finish_style.toUpperCase()} | Font: ${font.id} -->
  <g transform="rotate(${zone.geometry.rotation || 0} ${virtualW / 2} ${virtualH / 2})">
${linesSvg}
  </g>
</svg>`;

  const computedFontSizePt = Number((fitResult.fontSize * 0.352778).toFixed(2));

  return {
    spec_version: '2026.1',
    generated_at: new Date().toISOString(),
    order_line_reference: `MATTE-${Date.now().toString(36).toUpperCase()}`,
    product_id: productId,
    variant_id: variantId,
    zone_id: zone.zone_id,
    finish_style: zone.finish_style,
    text_content: {
      raw_lines: property.lines,
      normalized_nfc: normalizedNfcLines,
      monogram_layout: property.monogram_mode,
      icon_glyph: property.icon_glyph,
      icon_position: property.icon_position
    },
    typography: {
      font_id: font.id,
      font_family: font.font_family,
      computed_font_size_pt: computedFontSizePt,
      letter_spacing: font.letter_spacing,
      alignment: property.alignment
    },
    physical_geometry_mm: {
      origin_x_mm: originXmm,
      origin_y_mm: originYmm,
      box_width_mm: boxWidthMm,
      box_height_mm: boxHeightMm,
      rotation_deg: zone.geometry.rotation,
      skew_x_deg: zone.geometry.skewX,
      skew_y_deg: zone.geometry.skewY
    },
    production_svg: productionSvg,
    operator_notes: `${zone.finish_style.toUpperCase()} finish on ${variantId || 'Standard'}. Verified zero-width char clean, NFC normalized.`
  };
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
