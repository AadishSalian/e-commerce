export interface Hotspot {
  id: string;
  productId: string;
  imageId: string; // URL or identifier of the image
  variantIds?: string[]; // Optional: if empty or undefined, applies to all variants
  x: number; // 0 - 100 percentage of the image natural width
  y: number; // 0 - 100 percentage of the image natural height
  title: string; // 3-5 words
  description: string; // 1-2 sentences, max 120 chars
  order: number; // 1-based order for keyboard & tour navigation
  detailImage?: string; // Optional close-up crop URL (~96px)
  link?: string; // Optional anchor or URL (e.g. "#details", "#materials")
  createdAt?: string;
  updatedAt?: string;
}

export interface HotspotValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  overlappingPairs?: [string, string][]; // IDs of hotspots too close to each other (< 8%)
}

export interface RenderedMarkerPosition {
  xPx: number;
  yPx: number;
  xPercentContainer: number;
  yPercentContainer: number;
  isVisible: boolean;
  nudgedX?: number;
  nudgedY?: number;
}

export type PlacementSide = 'top' | 'bottom';
export type AlignmentSide = 'left' | 'center' | 'right';

export interface CalloutPosition {
  side: PlacementSide;
  alignment: AlignmentSide;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  arrowOffsetPx: number; // Offset in px from the card's left edge
  isMobileSheet?: boolean;
}
