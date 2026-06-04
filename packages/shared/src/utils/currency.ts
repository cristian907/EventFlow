export type SupportedCurrency = 'USD' | 'VES' | 'EUR';

export function convertToUSD(
    amount: number,
    currency: SupportedCurrency,
    rateVesToUsd: number,
    eurRate?: number,
    usdRate?: number,
): number {
    if (currency === 'USD') return amount;
    if (currency === 'EUR') {
        if (eurRate && usdRate && usdRate > 0) {
            return amount * (eurRate / usdRate);
        }
        return amount; // fallback 1:1
    }
    return rateVesToUsd > 0 ? amount / rateVesToUsd : 0;
}

export function sumPaymentsInUSD(
    payments: Array<{ amount: number; currency: SupportedCurrency }>,
    rateVesToUsd: number,
    eurRate?: number,
    usdRate?: number,
): number {
    return payments.reduce(
        (acc, p) => acc + convertToUSD(p.amount, p.currency, rateVesToUsd, eurRate, usdRate),
        0,
    );
}

/**
 * Converts a payment amount in any currency to the target event base currency.
 */
export function convertToDivisa(
    amount: number,
    paymentCurrency: SupportedCurrency,
    baseCurrency: 'USD' | 'EUR',
    activeRate: number, // VES per base divisa
    eurRate: number, // VES per EUR
    usdRate: number, // VES per USD
): number {
    if (paymentCurrency === baseCurrency) {
        return amount;
    }
    if (paymentCurrency === 'VES') {
        return activeRate > 0 ? amount / activeRate : 0;
    }
    // paymentCurrency is a different divisa (e.g., USD for EUR event, or EUR for USD event)
    let amountInVes = 0;
    if (paymentCurrency === 'USD') {
        amountInVes = amount * usdRate;
    } else if (paymentCurrency === 'EUR') {
        amountInVes = amount * eurRate;
    }
    return activeRate > 0 ? amountInVes / activeRate : 0;
}

/**
 * Sums payments converted to the event's base currency.
 */
export function sumPaymentsInDivisa(
    payments: Array<{ amount: number; currency: SupportedCurrency }>,
    baseCurrency: 'USD' | 'EUR',
    activeRate: number,
    eurRate: number,
    usdRate: number,
): number {
    return payments.reduce(
        (acc, p) =>
            acc + convertToDivisa(p.amount, p.currency, baseCurrency, activeRate, eurRate, usdRate),
        0,
    );
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
