import { z } from 'zod';

export const EventToCreateSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    description: z.string().min(1, 'La descripción es obligatoria'),
    date: z.string().min(1, 'La fecha es obligatoria'),
    startTime: z.string().min(1, 'La hora de inicio es obligatoria'),
    endTime: z.string().min(1, 'La hora de finalización es obligatoria'),
    location: z.string().min(1, 'La ubicación es obligatoria'),
    address: z.string().min(1, 'La dirección es obligatoria'),
    maxCapacity: z.preprocess(
        (val) => {
            if (typeof val === 'string') {
                const parsed = parseInt(val, 10);
                return isNaN(parsed) ? undefined : parsed;
            }
            return val;
        },
        z
            .number({ message: 'La capacidad es obligatoria y debe ser un número' })
            .int()
            .positive('La capacidad máxima debe ser mayor a 0'),
    ),
    imageUrl: z.string().optional().or(z.literal('')),
});

export type EventToCreate = z.infer<typeof EventToCreateSchema>;
