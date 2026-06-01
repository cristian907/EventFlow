import { z } from 'zod';

const preprocessNumber = (val: unknown): unknown => {
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
    }
    return val;
};

export const ExchangeRateToCreateSchema = z.object({
    rate: z.preprocess(
        preprocessNumber,
        z
            .number({ message: 'La tasa es obligatoria y debe ser un número' })
            .positive('La tasa debe ser mayor a 0'),
    ),
});

export type ExchangeRateToCreate = z.infer<typeof ExchangeRateToCreateSchema>;
