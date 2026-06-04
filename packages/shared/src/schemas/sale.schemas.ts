import { z } from 'zod';

export const SalePaymentSchema = z.object({
    paymentMethodId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    currency: z.enum(['USD', 'VES', 'EUR']),
    reference: z.string().optional(),
    receiptUrl: z.string().url().optional(),
});

export const SaleToCreateSchema = z.object({
    ticketTypeId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    customer: z.object({
        idNumber: z.string().min(1, 'La cédula es obligatoria'),
        fullName: z.string().min(1, 'El nombre es obligatorio'),
        phone: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
        email: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.string().email('Formato de correo inválido').optional(),
        ),
    }),
    payments: z.array(SalePaymentSchema).min(1),
});
