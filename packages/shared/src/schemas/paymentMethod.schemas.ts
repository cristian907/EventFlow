import { z } from 'zod';

export const PaymentMethodCurrencyEnum = z.enum(['USD', 'VES', 'EUR']);

export const PaymentMethodToCreateSchema = z.object({
    name: z.string().min(1, 'El nombre del método de pago es obligatorio'),
    details: z.string().min(1, 'Los detalles de cobro son obligatorios'),
    currency: PaymentMethodCurrencyEnum,
    isActive: z.boolean().default(true),
});

export const PaymentMethodToUpdateSchema = z.object({
    name: z.string().min(1, 'El nombre del método de pago es obligatorio').optional(),
    details: z.string().min(1, 'Los detalles de cobro son obligatorios').optional(),
    currency: PaymentMethodCurrencyEnum.optional(),
    isActive: z.boolean().optional(),
});

export type PaymentMethodToCreate = z.infer<typeof PaymentMethodToCreateSchema>;
export type PaymentMethodToUpdate = z.infer<typeof PaymentMethodToUpdateSchema>;
