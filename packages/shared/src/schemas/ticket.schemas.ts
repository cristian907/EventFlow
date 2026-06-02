import { z } from 'zod';

export const TicketStatusEnum = z.enum(['VALID', 'USED', 'CANCELLED']);

export const TicketVerifySchema = z.object({
    qrData: z.string().min(1),
});

export type TicketVerifyInput = z.infer<typeof TicketVerifySchema>;
