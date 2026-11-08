/**
 * Unified Delivery Estimation Engine.
 * Single source of truth for logistics windows, production lead times, and calm range formatting.
 * Strictly avoids fake-precise promises.
 */

export interface DeliveryEstimateParams {
  orderPlacedDate?: Date;
  hasPersonalizedItems?: boolean;
  maxProductionDays?: number;
  shippingMethod?: 'standard' | 'express' | 'same_day';
  pincode?: string;
  isConfirmedByCarrier?: boolean;
}

export interface ComputedDeliveryEstimate {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  formattedDisplay: string; // e.g. "Thu 22 Oct to Sat 24 Oct"
  isEstimate: boolean;
  windowConfirmed: boolean;
  leadTimeDays: number;
}

/**
 * Calculates delivery estimate window based on order properties and production delays.
 */
export function calculateDeliveryEstimate(
  params: DeliveryEstimateParams = {}
): ComputedDeliveryEstimate {
  const baseDate = params.orderPlacedDate || new Date();
  const productionDays = params.hasPersonalizedItems ? params.maxProductionDays || 3 : 0;

  // Transit days based on shipping method
  let minTransitDays = 3;
  let maxTransitDays = 5;

  if (params.shippingMethod === 'express') {
    minTransitDays = 1;
    maxTransitDays = 2;
  } else if (params.shippingMethod === 'same_day') {
    minTransitDays = 0;
    maxTransitDays = 0;
  }

  // Calculate calendar days forward
  const startDayOffset = productionDays + minTransitDays;
  const endDayOffset = productionDays + maxTransitDays;

  const start = new Date(baseDate.getTime() + startDayOffset * 24 * 60 * 60 * 1000);
  const end = new Date(baseDate.getTime() + endDayOffset * 24 * 60 * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const startDateIso = formatIso(start);
  const endDateIso = formatIso(end);

  const weekdayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  let formattedDisplay: string;
  if (startDayOffset === endDayOffset) {
    formattedDisplay = weekdayFormatter.format(start);
  } else {
    formattedDisplay = `${weekdayFormatter.format(start)} to ${weekdayFormatter.format(end)}`;
  }

  return {
    startDate: startDateIso,
    endDate: endDateIso,
    formattedDisplay,
    isEstimate: !params.isConfirmedByCarrier,
    windowConfirmed: !!params.isConfirmedByCarrier,
    leadTimeDays: endDayOffset,
  };
}
