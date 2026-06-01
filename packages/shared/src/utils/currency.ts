export type SupportedCurrency = 'USD' | 'VES' | 'EUR';

/**
 * Converts an amount in any supported currency to USD.
 * EUR is treated 1:1 with USD (adjust if a separate rate is available).
 */
export function convertToUSD(
    amount: number,
    currency: SupportedCurrency,
    rateVesToUsd: number,
): number {
    if (currency === 'USD' || currency === 'EUR') return amount;
    return amount / rateVesToUsd;
}

export function sumPaymentsInUSD(
    payments: Array<{ amount: number; currency: SupportedCurrency }>,
    rateVesToUsd: number,
): number {
    return payments.reduce((acc, p) => acc + convertToUSD(p.amount, p.currency, rateVesToUsd), 0);
}
