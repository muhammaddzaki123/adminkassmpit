export function parseCurrencyInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/[^\d]/g, '');
}

export function formatCurrencyInput(value: string | number | null | undefined): string {
  const raw = parseCurrencyInput(value);

  if (!raw) {
    return '';
  }

  return Number(raw).toLocaleString('id-ID');
}

export function normalizeCurrencyAmount(value: string | number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value) : Number.NaN;
  }

  const raw = parseCurrencyInput(value);
  if (!raw) {
    return Number.NaN;
  }

  return Number(raw);
}