export interface BcvRateType {
    usdRate: number;
    eurRate: number;
    valueDate?: string;
    scrapedAt: string;
    isStale: boolean;
    ageMs: number;
}
