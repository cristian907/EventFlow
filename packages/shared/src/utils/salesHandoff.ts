import { SalesHandoffItem } from '../types/botConfig.types';

/**
 * Construye un enlace `wa.me` con un resumen estructurado de la intención de compra,
 * para que el agente humano de ventas continúe la conversación por WhatsApp.
 *
 * @param whatsappNumber Número en formato internacional (con o sin '+').
 * @param eventName Nombre del evento.
 * @param items Tipos de entrada + cantidades que el usuario quiere.
 * @returns URL `https://wa.me/<num>?text=<resumen>` (texto url-encoded).
 */
export function buildWhatsappHandoffUrl(
    whatsappNumber: string,
    eventName: string,
    items: SalesHandoffItem[],
): string {
    const normalizedNumber = whatsappNumber.replace(/[^\d]/g, '');

    const lines = items.map((item) => `• ${item.quantity} x ${item.ticketTypeName}`);
    const summary = [
        `¡Hola! Quiero comprar entradas para *${eventName}*:`,
        ...lines,
        '',
        '¿Me ayudas a completar la compra?',
    ].join('\n');

    return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(summary)}`;
}
