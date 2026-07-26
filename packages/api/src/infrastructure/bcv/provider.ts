import BcvRate from '../../core/entities/BcvRate';
import IBcvRateRepository from '../../core/interfaces/repositories/IBcvRateRepository';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import { scrapeBcvRates } from './scraper';

export class BcvProvider {
    private currentRate: BcvRate | null = null;
    private isRefreshing: boolean = false;
    private ttlMs: number;

    constructor(
        private bcvRateRepository: IBcvRateRepository,
        private eventRepository: IEventRepository,
        private exchangeRateRepository: IExchangeRateRepository,
        private ticketTypeRepository: ITicketTypeRepository,
        ttlMsStr?: string,
    ) {
        const parsedTtl = ttlMsStr ? Number(ttlMsStr) : NaN;
        this.ttlMs = Number.isFinite(parsedTtl) ? parsedTtl : 1000 * 60 * 60; // Default 1 hour
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
            while (this.isRefreshing) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
            if (this.currentRate) return this.currentRate;
            throw new Error('Refresh completed, but no current rate exists.');
        }

        this.isRefreshing = true;
        try {
            const scraped = await scrapeBcvRates();
            const now = new Date();

            // Persist
            const newRate = await this.bcvRateRepository.create({
                usdRate: scraped.usdRate,
                eurRate: scraped.eurRate,
                usdtRate: scraped.usdtRate,
                valueDate: scraped.valueDate,
                scrapedAt: now,
            });

            this.currentRate = newRate;

            // Trigger auto-sync for events.
            await this.triggerAutoSync(newRate);

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

    private async triggerAutoSync(newRate: BcvRate): Promise<void> {
        try {
            const autoSyncEvents = await this.eventRepository.findActiveAutoSyncEvents();

            for (const event of autoSyncEvents) {
                let targetRate: number | null = null;
                if (event.rateSource === 'USD_BCV') {
                    targetRate = newRate.usdRate;
                } else if (event.rateSource === 'EUR_BCV') {
                    targetRate = newRate.eurRate;
                } else if (event.rateSource === 'USDT_PARALELO') {
                    targetRate = newRate.usdtRate || newRate.usdRate;
                }

                if (targetRate === null) continue;

                const targetSource = event.rateSource === 'USDT_PARALELO' ? 'paralelo' : 'bcv';
                const currentExchangeRate = await this.exchangeRateRepository.findCurrentByEventId(
                    event.id,
                );

                // Only insert if it differs from current event rate or if the source differs
                const currentRateNum = currentExchangeRate
                    ? Number(currentExchangeRate.rate)
                    : null;
                const hasDiff =
                    !currentExchangeRate ||
                    currentRateNum !== targetRate ||
                    currentExchangeRate.source !== targetSource;

                const ticketTypes = await this.ticketTypeRepository.findByEventId(event.id, true);
                let ticketsNeedUpdate = false;
                for (const tt of ticketTypes) {
                    const expectedPrice = Number((tt.usdPrice * targetRate).toFixed(2));
                    if (tt.currency !== 'VES' || tt.price !== expectedPrice) {
                        ticketsNeedUpdate = true;
                        break;
                    }
                }

                if (hasDiff || ticketsNeedUpdate) {
                    if (hasDiff) {
                        await this.exchangeRateRepository.create({
                            eventId: event.id,
                            rate: targetRate,
                            source: targetSource,
                            effectiveAt: new Date(),
                        });
                    }

                    for (const tt of ticketTypes) {
                        const newPrice = Number((tt.usdPrice * targetRate).toFixed(2));
                        await this.ticketTypeRepository.update(tt.id, {
                            price: newPrice,
                            currency: 'VES',
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to trigger auto sync for events:', error);
        }
    }
}
