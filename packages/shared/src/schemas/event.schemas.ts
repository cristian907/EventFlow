import { z } from 'zod';

/** Accepts "YYYY-MM-DD" (from <input type="date">) or full ISO datetime strings */
const isValidDateValue = (val: string): boolean => {
    const d = new Date(val);
    return !isNaN(d.getTime());
};

/** Accepts "HH:MM" / "HH:MM:SS" (from <input type="time">) or full ISO datetime strings */
const isValidTimeValue = (val: string): boolean => {
    // Raw time from <input type="time">
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(val)) return true;
    // Full ISO string from frontend conversion
    const d = new Date(val);
    return !isNaN(d.getTime());
};

/** Extract a comparable "HH:MM" string from either "HH:MM" or an ISO datetime */
const toComparableTime = (val: string): string => {
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(val)) return val.substring(0, 5);
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().substring(11, 16);
};

export const EventToCreateSchema = z
    .object({
        name: z.string().min(1, 'El nombre es obligatorio'),
        description: z.string().min(1, 'La descripción es obligatoria'),
        date: z
            .string()
            .min(1, 'La fecha es obligatoria')
            .refine(isValidDateValue, { message: 'La fecha del evento no es válida' }),
        startTime: z
            .string()
            .min(1, 'La hora de inicio es obligatoria')
            .refine(isValidTimeValue, { message: 'La hora de inicio no es válida' }),
        endTime: z
            .string()
            .min(1, 'La hora de finalización es obligatoria')
            .refine(isValidTimeValue, { message: 'La hora de finalización no es válida' }),
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
    })
    .refine(
        (data) => {
            const start = toComparableTime(data.startTime);
            const end = toComparableTime(data.endTime);
            if (!start || !end) return true; // already caught above
            return end > start;
        },
        {
            message: 'La hora de finalización debe ser posterior a la hora de inicio',
            path: ['endTime'],
        },
    );

export type EventToCreate = z.infer<typeof EventToCreateSchema>;
