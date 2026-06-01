import { ExchangeRateType } from '@eventflow/shared';
import { useEffect, useState } from 'react';

import { exchangeRateService } from '../services/exchangeRateService';

interface UseCurrentExchangeRateResult {
    rate: ExchangeRateType | null;
    isLoading: boolean;
    error: boolean;
    refetch: () => void;
}

export function useCurrentExchangeRate(
    eventId: string | null | undefined,
): UseCurrentExchangeRateResult {
    const [rate, setRate] = useState<ExchangeRateType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            if (!eventId) {
                setRate(null);
                setIsLoading(false);
                setError(false);
                return;
            }

            setIsLoading(true);
            setError(false);

            try {
                const { current } = await exchangeRateService.getCurrent(eventId);
                if (!cancelled) setRate(current);
            } catch {
                if (!cancelled) {
                    setRate(null);
                    setError(true);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [eventId, tick]);

    return { rate, isLoading, error, refetch: () => setTick((t) => t + 1) };
}
