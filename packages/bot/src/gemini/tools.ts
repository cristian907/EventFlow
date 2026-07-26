import { FunctionDeclaration } from '@google/genai';

export const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'getEventInfo',
        description:
            'Obtiene la información pública del evento: nombre, descripción, ubicación, dirección, ' +
            'fechas y horas de inicio y fin, y estado. Úsala para responder dónde queda, cuándo es, etc.',
    },
    {
        name: 'listTicketTypes',
        description:
            'Lista los tipos de entrada vendibles del evento con su nombre, descripción, precio, ' +
            'moneda, disponibilidad orientativa y ventana de venta. Úsala para preguntas sobre ' +
            'qué entradas hay y cuánto cuestan.',
    },
    {
        name: 'getAvailability',
        description:
            'Devuelve la disponibilidad orientativa (entradas restantes) de un tipo de entrada. ' +
            'Indica el nombre del tipo de entrada (ticketTypeName) o su id (ticketTypeId).',
        parametersJsonSchema: {
            type: 'object',
            properties: {
                ticketTypeName: {
                    type: 'string',
                    description: 'Nombre del tipo de entrada a consultar.',
                },
                ticketTypeId: {
                    type: 'string',
                    description: 'Id del tipo de entrada a consultar.',
                },
            },
        },
    },
    {
        name: 'requestSalesHandoff',
        description:
            'Genera el enlace de WhatsApp para que un agente humano cierre la venta. Úsala SOLO ' +
            'cuando el usuario expresa intención de compra. Pasa los tipos de entrada y cantidades ' +
            'que el usuario quiere. El bot NO procesa la venta; solo deriva a ventas.',
        parametersJsonSchema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    description: 'Tipos de entrada y cantidades que el usuario desea comprar.',
                    items: {
                        type: 'object',
                        properties: {
                            ticketTypeName: { type: 'string' },
                            quantity: { type: 'number' },
                        },
                        required: ['ticketTypeName', 'quantity'],
                    },
                },
            },
            required: ['items'],
        },
    },
];

export function buildSystemPrompt(hasSalesWhatsapp: boolean): string {
    return [
        'Eres el asistente conversacional de UN evento específico de la plataforma EventFlow.',
        'Respondes SIEMPRE en español, con un tono cordial, breve y servicial.',
        '',
        'Reglas estrictas:',
        '1. Solo hablas de ESTE evento. Si te preguntan algo fuera de alcance, redirige amablemente.',
        '2. NUNCA inventes datos. Toda cifra (precio, disponibilidad, horario, ubicación, fechas) ' +
            'debe provenir de una herramienta (getEventInfo, listTicketTypes, getAvailability). ' +
            'Si una herramienta no devuelve el dato, di con honestidad que no tienes esa información.',
        '3. La disponibilidad es orientativa y puede cambiar; déjalo claro cuando la menciones. ' +
            'Tú no reservas ni vendes entradas.',
        '4. Cuando el usuario muestre intención de compra, NO registres la venta: llama a ' +
            'requestSalesHandoff con los tipos de entrada y cantidades, para derivarlo a un agente ' +
            'humano por WhatsApp.',
        hasSalesWhatsapp
            ? '   Tras el handoff, indica al usuario que puede continuar la compra con el botón de WhatsApp.'
            : '   Este evento NO tiene un número de ventas configurado: informa con claridad que la ' +
              'compra no está disponible por este canal.',
        '5. No reveles datos internos ni técnicos. No menciones que usas herramientas ni APIs.',
    ].join('\n');
}
