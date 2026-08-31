/** ISO 4217 minor-unit exponents for common currencies; default 2. */
const MINOR_UNITS: Record<string, number> = {
  BHD: 3,
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  IQD: 3,
  ISK: 0,
  JOD: 3,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  PYG: 0,
  RWF: 0,
  TND: 3,
  UGX: 0,
  UYI: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
};

export function currencyExponent(currency: string): number {
  const code = currency.toUpperCase();
  return MINOR_UNITS[code] ?? 2;
}

export function assertMinorUnitInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer (minor units)`);
  }
}

/** Line total in minor units: round(quantity * rate). */
export function lineTotalMinor(quantity: number, rateMinor: number): number {
  return Math.round(quantity * rateMinor);
}

export function computeInvoiceTotals(
  lineItems: Array<{ quantity: number; rate: number }>,
  taxPercentage: number,
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = lineItems.reduce((sum, item) => sum + lineTotalMinor(item.quantity, item.rate), 0);
  const taxAmount = Math.round((subtotal * taxPercentage) / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export function formatMoney(minor: number, currency: string, locale = 'en-US'): string {
  const exp = currencyExponent(currency);
  const major = minor / 10 ** exp;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(
    major,
  );
}
