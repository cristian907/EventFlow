import { z } from 'zod';

export const StaffToCreateSchema = z.object({
    fullName: z.string().min(1, 'El nombre completo es obligatorio'),
    email: z.email('La dirección de correo electrónico no es válida'),
    phoneNumber: z.string().min(10, 'El número de teléfono debe tener al menos 10 dígitos'),
    role: z.enum(['admin', 'collaborator', 'scanner'], {
        message: 'El rol de evento es obligatorio',
    }),
    password: z
        .string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .optional()
        .or(z.literal('')),
});

export type StaffToCreate = z.infer<typeof StaffToCreateSchema>;

export const StaffToUpdateSchema = z
    .object({
        role: z.enum(['admin', 'collaborator', 'scanner']).optional(),
        status: z.enum(['active', 'inactive']).optional(),
    })
    .refine((data) => data.role !== undefined || data.status !== undefined, {
        message: 'Debe proporcionar al menos un campo a actualizar (role o status)',
    });

export type StaffToUpdate = z.infer<typeof StaffToUpdateSchema>;
