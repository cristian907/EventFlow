import { BotConfigToUpsert, BotConfigTest } from '../schemas/botConfig.schemas';

import { EventStatus } from './event.types';
import { Currency } from './ticketType.types';

// ── Lectura para el frontend (token siempre enmascarado, nunca en claro) ──
export interface BotConfig {
    eventId: string;
    hasToken: boolean;
    tokenMask: string | null; // p. ej. "••••1234"
    salesWhatsappNumber: string | null;
    salesHandoffMessage: string | null;
    welcomeMessage: string | null;
    isEnabled: boolean;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface BotConfigTestResult {
    ok: boolean;
    botUsername: string | null;
}

// ── Tipos públicos consumidos por las tools del bot (whitelist de campos seguros) ──
export interface PublicEvent {
    id: string;
    name: string;
    description: string;
    location: string;
    address: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    status: EventStatus;
}

export interface PublicTicketType {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: Currency;
    available: number;
    saleStartsAt: string | null;
    saleEndsAt: string | null;
}

export interface PublicAvailability {
    ticketTypeId: string;
    name: string;
    available: number;
}

// ── Handoff a WhatsApp ──
export interface SalesHandoffItem {
    ticketTypeName: string;
    quantity: number;
}

export interface SalesHandoffIntent {
    eventName: string;
    items: SalesHandoffItem[];
}

// ── Config interna que recibe el worker (token DESCIFRADO) ──
export interface InternalBotConfig {
    eventId: string;
    telegramBotToken: string;
    salesWhatsappNumber: string | null;
    salesHandoffMessage: string | null;
    welcomeMessage: string | null;
    updatedAt: string;
}

export type BotConfigToUpsertType = BotConfigToUpsert;
export type BotConfigTestType = BotConfigTest;
