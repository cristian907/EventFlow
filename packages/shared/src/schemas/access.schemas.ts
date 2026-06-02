import { z } from 'zod';

export const AccessScanSchema = z.object({
    qrData: z.string().min(1),
});

export const AccessSearchQuerySchema = z.object({
    idNumber: z.string().min(1),
});

export type AccessScanInput = z.infer<typeof AccessScanSchema>;
export type AccessSearchQueryInput = z.infer<typeof AccessSearchQuerySchema>;
