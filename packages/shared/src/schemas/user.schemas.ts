import { z } from 'zod';

export const UserToCreateSchema = z.object({
    fullName: z.string().min(1, 'El nombre completo es obligatorio'),
    email: z.email('La dirección de correo electrónico no es válida'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    phoneNumber: z.string().min(10, 'El número de teléfono debe tener al menos 10 dígitos'),
});

export type UserToCreate = z.infer<typeof UserToCreateSchema>;

export const UserToLoginSchema = z.object({
    email: z.email('La dirección de correo electrónico no es válida'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type UserToLogin = z.infer<typeof UserToLoginSchema>;
