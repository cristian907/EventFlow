import { config } from './config';

export default class RateLimiter {
    private hits = new Map<string, number[]>();

    allow(chatId: string): boolean {
        const now = Date.now();
        const windowStart = now - config.rateLimitWindowMs;

        const timestamps = (this.hits.get(chatId) ?? []).filter((t) => t > windowStart);
        if (timestamps.length >= config.rateLimitMaxMessages) {
            this.hits.set(chatId, timestamps);
            return false;
        }

        timestamps.push(now);
        this.hits.set(chatId, timestamps);
        return true;
    }
}
