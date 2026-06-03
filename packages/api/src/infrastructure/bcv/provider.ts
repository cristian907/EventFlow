import BcvRate from '../../core/entities/BcvRate';
import { EventStatus } from '../../core/entities/Event';
import IBcvRateRepository from '../../core/interfaces/repositories/IBcvRateRepository';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';

import { scrapeBcvRates } from './scraper';

export class BcvProvider {
    private currentRate: BcvRate | null = null;
    private isRefreshing: boolean = false;
    private ttlMs: number;

    constructor(
        private bcvRateRepository: IBcvRateRepository,
        private eventRepository: IEventRepository,
        private exchangeRateRepository: IExchangeRateRepository,
        ttlMsStr?: string,
    ) {
        this.ttlMs = ttlMsStr ? parseInt(ttlMsStr, 10) : 1000 * 60 * 60; // Default 1 hour
    }

    public async init(): Promise<void> {
        const latest = await this.bcvRateRepository.findLatest();
        if (latest) {
            this.currentRate = latest;
        } else {
            // First time ever, need synchronous fetch
            await this.refresh();
        }
    }

    public async getRate(): Promise<{ rate: BcvRate; isStale: boolean; ageMs: number }> {
        if (!this.currentRate) {
            await this.refresh(); // Wait if we don't have ANY rate
        }

        const now = Date.now();
        const ageMs = this.currentRate ? now - this.currentRate.scrapedAt.getTime() : 0;
        const isStale = ageMs > this.ttlMs;

        if (isStale && !this.isRefreshing) {
            // Stale-while-revalidate: don't await
            this.refresh().catch((err) => console.error('Background BCV refresh failed:', err));
        }

        if (!this.currentRate) {
            throw new Error('Failed to retrieve BCV rate');
        }

        return {
            rate: this.currentRate,
            isStale,
            ageMs,
        };
    }

    public async refresh(): Promise<BcvRate> {
        if (this.isRefreshing) {
            if (this.currentRate) return this.currentRate;
            throw new Error('Refresh already in progress and no current rate exists.');
        }

        this.isRefreshing = true;
        try {
            const scraped = await scrapeBcvRates();
            const now = new Date();

            // Persist
            const newRate = await this.bcvRateRepository.create({
                usdRate: scraped.usdRate,
                eurRate: scraped.eurRate,
                valueDate: scraped.valueDate,
                scrapedAt: now,
            });

            this.currentRate = newRate;

            // Trigger auto-sync for events. The method internally skips events that already have the correct rate & source.
            await this.triggerAutoSync(scraped.usdRate);

            return newRate;
        } catch (error) {
            console.error('Failed to refresh BCV rates:', error);
            if (this.currentRate) {
                return this.currentRate;
            }
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    private async triggerAutoSync(newUsdRate: number): Promise<void> {
        try {
            // Find all events with autoSyncBcv = true. We'll do this in batches if needed,
            // but for now, we can fetch all Active and Draft events
            // In a real scenario, a dedicated query to get autoSync events would be better.
            const { events } = await this.eventRepository.findAndCount({
                page: 1,
                limit: 1000,
            });

            const autoSyncEvents = events.filter(
                (e) => e.autoSyncBcv && e.status !== EventStatus.Cancelled,
            );

            for (const event of autoSyncEvents) {
                const currentExchangeRate = await this.exchangeRateRepository.findCurrentByEventId(
                    event.id,
                );

                // Only insert if it differs from current event rate or if the source is not bcv
                if (
                    !currentExchangeRate ||
                    currentExchangeRate.rate !== newUsdRate ||
                    currentExchangeRate.source !== 'bcv'
                ) {
                    await this.exchangeRateRepository.create({
                        eventId: event.id,
                        rate: newUsdRate,
                        source: 'bcv',
                        effectiveAt: new Date(),
                    });
                }
            }
        } catch (error) {
            console.error('Failed to trigger auto sync for events:', error);
        }
    }
}
