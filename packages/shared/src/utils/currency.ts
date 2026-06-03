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

/**
 * Derives EUR→USD rate from BCV rates.
 * eurRate = Bs per 1 EUR, usdRate = Bs per 1 USD.
 * Result = how many USD one EUR buys.
 */
export function getEurUsdRate(eurRate: number, usdRate: number): number {
    if (usdRate === 0) return 0;
    return eurRate / usdRate;
}
