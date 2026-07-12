import { z } from 'zod';

export const GlobalDashboardQuerySchema = z.object({
    page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => (val ? Number(val) : 10), z.number().int().min(1).default(10)),
    search: z.string().optional().or(z.literal('')),
    status: z.enum(['DRAFT', 'ACTIVE', 'CANCELLED']).optional().or(z.literal('')),
    sortBy: z.enum(['revenue', 'occupancy', 'attendance']).optional().or(z.literal('')),
    sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export type GlobalDashboardQuery = z.infer<typeof GlobalDashboardQuerySchema>;
