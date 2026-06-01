import { z } from 'zod';

// ── Currency enum ──
export const CurrencyEnum = z.enum(['USD', 'VES']);

// ── Helpers ──
const isValidOptionalDate = (val: string): boolean => {
    const d = new Date(val);
    return !isNaN(d.getTime());
};

const preprocessNumber = (val: unknown): unknown => {
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
    }
    return val;
};

const preprocessInt = (val: unknown): unknown => {
    if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
    }
    return val;
};

// ── Create Schema ──
export const TicketTypeToCreateSchema = z
    .object({
        name: z.string().min(1, 'El nombre es obligatorio'),
        description: z.string().optional().default(''),
        price: z.preprocess(
            preprocessNumber,
            z
                .number({ message: 'El precio es obligatorio y debe ser un número' })
                .positive('El precio debe ser mayor a 0'),
        ),
        currency: CurrencyEnum.default('USD'),
        totalQuantity: z.preprocess(
            preprocessInt,
            z
                .number({ message: 'La cantidad es obligatoria y debe ser un número' })
                .int('La cantidad debe ser un número entero')
                .positive('La cantidad debe ser mayor a 0'),
        ),
        saleStartsAt: z
            .string()
            .refine(isValidOptionalDate, { message: 'La fecha de inicio de venta no es válida' })
            .optional()
            .or(z.literal(''))
            .transform((val) => (val === '' ? undefined : val)),
        saleEndsAt: z
            .string()
            .refine(isValidOptionalDate, { message: 'La fecha de fin de venta no es válida' })
            .optional()
            .or(z.literal(''))
            .transform((val) => (val === '' ? undefined : val)),
    })
    .refine(
        (data) => {
            if (data.saleStartsAt && data.saleEndsAt) {
                return new Date(data.saleStartsAt) < new Date(data.saleEndsAt);
            }
            return true;
        },
        {
            message: 'La fecha de inicio de venta debe ser anterior a la fecha de fin',
            path: ['saleEndsAt'],
        },
    );

export type TicketTypeToCreate = z.infer<typeof TicketTypeToCreateSchema>;

// ── Update Schema ──
export const TicketTypeToUpdateSchema = z
    .object({
        name: z.string().min(1, 'El nombre es obligatorio').optional(),
        description: z.string().optional(),
        price: z
            .preprocess(
                preprocessNumber,
                z
                    .number({ message: 'El precio debe ser un número' })
                    .positive('El precio debe ser mayor a 0'),
            )
            .optional(),
        currency: CurrencyEnum.optional(),
        totalQuantity: z
            .preprocess(
                preprocessInt,
                z
                    .number({ message: 'La cantidad debe ser un número' })
                    .int('La cantidad debe ser un número entero')
                    .positive('La cantidad debe ser mayor a 0'),
            )
            .optional(),
        isActive: z.boolean().optional(),
        saleStartsAt: z
            .string()
            .refine(isValidOptionalDate, { message: 'La fecha de inicio de venta no es válida' })
            .nullable()
            .optional()
            .transform((val) => (val === '' ? null : val)),
        saleEndsAt: z
            .string()
            .refine(isValidOptionalDate, { message: 'La fecha de fin de venta no es válida' })
            .nullable()
            .optional()
            .transform((val) => (val === '' ? null : val)),
    })
    .refine(
        (data) => {
            if (data.saleStartsAt && data.saleEndsAt) {
                return new Date(data.saleStartsAt) < new Date(data.saleEndsAt);
            }
            return true;
        },
        {
            message: 'La fecha de inicio de venta debe ser anterior a la fecha de fin',
            path: ['saleEndsAt'],
        },
    );

export type TicketTypeToUpdate = z.infer<typeof TicketTypeToUpdateSchema>;
