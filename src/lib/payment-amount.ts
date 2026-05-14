export const PAYMENT_DECIMAL_PLACES = 2;
export const PAYMENT_SCALE = 10 ** PAYMENT_DECIMAL_PLACES;

export function normalizePaymentAmount(value: string | number): number {
  const numericValue = typeof value === 'string'
    ? Number(value.replace(/[^\d.-]/g, ''))
    : value;

  if (!Number.isFinite(numericValue)) {
    return Number.NaN;
  }

  return Math.round((numericValue + Number.EPSILON) * PAYMENT_SCALE) / PAYMENT_SCALE;
}
