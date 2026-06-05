import { z } from 'zod';

// ── Helpers ──
const emptyToUndefined = (val: unknown): unknown =>
    typeof val === 'string' && val.trim() === '' ? undefined : val;

// Telegram bot token format: <bot_id>:<auth_token>
const TELEGRAM_TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]{30,}$/;

// International phone number, e.g. +584141234567
const WHATSAPP_REGEX = /^\+\d{7,15}$/;

// ── Upsert Schema (admin del evento) ──
// El token es opcional: si no se envía (o llega vacío) NO se sobrescribe el existente.
export const BotConfigToUpsertSchema = z.object({
    telegramBotToken: z.preprocess(
        emptyToUndefined,
        z
            .string()
            .regex(TELEGRAM_TOKEN_REGEX, 'El token de Telegram no tiene un formato válido')
            .optional(),
    ),
    salesWhatsappNumber: z.preprocess(
        emptyToUndefined,
        z
            .string()
            .regex(
                WHATSAPP_REGEX,
                'El número de WhatsApp debe estar en formato internacional, ej. +584141234567',
            )
            .nullable()
            .optional(),
    ),
    salesHandoffMessage: z.preprocess(
        emptyToUndefined,
        z.string().max(500, 'El mensaje no puede superar los 500 caracteres').nullable().optional(),
    ),
    welcomeMessage: z.preprocess(
        emptyToUndefined,
        z.string().max(500, 'El mensaje no puede superar los 500 caracteres').nullable().optional(),
    ),
    isEnabled: z.boolean().default(false),
});

export type BotConfigToUpsert = z.infer<typeof BotConfigToUpsertSchema>;

// ── Test token Schema (opcional) ──
export const BotConfigTestSchema = z.object({
    telegramBotToken: z.preprocess(
        emptyToUndefined,
        z
            .string()
            .regex(TELEGRAM_TOKEN_REGEX, 'El token de Telegram no tiene un formato válido')
            .optional(),
    ),
});

export type BotConfigTest = z.infer<typeof BotConfigTestSchema>;
