import { z } from 'zod';

export const UpdateSettingsSchema = z.object({
    defaultRateSource: z.enum(['USD_BCV', 'EUR_BCV', 'USDT_PARALELO', 'CUSTOM', 'NONE']),
});

export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
