export interface BcvRateType {
    usdRate: number;
    eurRate: number;
    usdtRate?: number;
    valueDate?: string;
    scrapedAt: string;
    isStale: boolean;
    ageMs: number;
}
