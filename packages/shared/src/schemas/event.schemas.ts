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
        startDate: z
            .string()
            .min(1, 'La fecha de inicio es obligatoria')
            .refine(isValidDateValue, { message: 'La fecha de inicio no es válida' }),
        endDate: z
            .string()
            .min(1, 'La fecha de fin es obligatoria')
            .refine(isValidDateValue, { message: 'La fecha de fin no es válida' }),
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
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;

            // Compare only year, month, day to ignore time parts
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return end >= start;
        },
        {
            message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
            path: ['endDate'],
        },
    )
    .refine(
        (data) => {
            const start = toComparableTime(data.startTime);
            const end = toComparableTime(data.endTime);
            if (!start || !end) return true; // already caught above

            if (data.startDate === data.endDate) {
                return end > start;
            }
            return true;
        },
        {
            message:
                'La hora de finalización debe ser posterior a la hora de inicio en el mismo día',
            path: ['endTime'],
        },
    );

export type EventToCreate = z.infer<typeof EventToCreateSchema>;
