import { CurrencyCode } from '../types/index.ts';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToUSD: number; // Approximate reference rate
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 1.08 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 1.28 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUSD: 0.012 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToUSD: 0.74 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToUSD: 0.65 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUSD: 0.0067 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateToUSD: 1.13 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateToUSD: 0.75 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rateToUSD: 0.272 },
};

/**
 * Converts amount from fromCurrency to toCurrency
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const fromRate = SUPPORTED_CURRENCIES[from]?.rateToUSD || 1;
  const toRate = SUPPORTED_CURRENCIES[to]?.rateToUSD || 1;
  const amountInUSD = amount * fromRate;
  const converted = amountInUSD / toRate;
  return Math.round(converted * 100) / 100;
}

export function formatMoney(amount: number, currency: CurrencyCode = 'USD'): string {
  const meta = SUPPORTED_CURRENCIES[currency] || { symbol: '$' };
  const abs = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}${meta.symbol}${abs}`;
}
