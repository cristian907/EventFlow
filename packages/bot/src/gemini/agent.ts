import { InternalBotConfig, SalesHandoffItem, buildWhatsappHandoffUrl } from '@eventflow/shared';
import { Content, GoogleGenAI, Part } from '@google/genai';

import ApiClient from '../api/client';
import { config } from '../config';
import { logger } from '../logger';

import { buildSystemPrompt, functionDeclarations } from './tools';

const MAX_TOOL_LOOPS = 6;

export interface AgentResult {
    text: string;
    handoffUrl: string | null;
    history: Content[];
}

type ToolArgs = Record<string, unknown>;

export default class GeminiAgent {
    private ai: GoogleGenAI;

    constructor(private apiClient: ApiClient) {
        this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }

    async processMessage(params: {
        botConfig: InternalBotConfig;
        history: Content[];
        userText: string;
    }): Promise<AgentResult> {
        const { botConfig, history, userText } = params;
        const systemInstruction = buildSystemPrompt(Boolean(botConfig.salesWhatsappNumber));

        const contents: Content[] = [...history, { role: 'user', parts: [{ text: userText }] }];
        let handoffUrl: string | null = null;

        for (let i = 0; i < MAX_TOOL_LOOPS; i++) {
            const response = await this.ai.models.generateContent({
                model: config.geminiModel,
                contents,
                config: {
                    systemInstruction,
                    tools: [{ functionDeclarations }],
                },
            });

            const modelContent = response.candidates?.[0]?.content;
            if (modelContent) contents.push(modelContent);

            const calls = response.functionCalls ?? [];
            if (calls.length === 0) {
                return {
                    text: response.text ?? 'Lo siento, no pude generar una respuesta.',
                    handoffUrl,
                    history: contents,
                };
            }

            const responseParts: Part[] = [];
            for (const call of calls) {
                if (!call.name) continue;
                const result = await this.executeTool(call.name, call.args ?? {}, botConfig);
                if (result.handoffUrl) handoffUrl = result.handoffUrl;
                responseParts.push({
                    functionResponse: { name: call.name, response: result.response },
                });
            }
            contents.push({ role: 'user', parts: responseParts });
        }

        return {
            text: 'Lo siento, no pude completar tu solicitud en este momento. Intenta de nuevo.',
            handoffUrl,
            history: contents,
        };
    }

    private async executeTool(
        name: string,
        args: ToolArgs,
        botConfig: InternalBotConfig,
    ): Promise<{ response: Record<string, unknown>; handoffUrl?: string }> {
        const { eventId } = botConfig;
        try {
            switch (name) {
                case 'getEventInfo': {
                    const event = await this.apiClient.getPublicEvent(eventId);
                    return { response: { event } };
                }
                case 'listTicketTypes': {
                    const ticketTypes = await this.apiClient.getPublicTicketTypes(eventId);
                    return { response: { ticketTypes } };
                }
                case 'getAvailability': {
                    const ticketTypeId = await this.resolveTicketTypeId(eventId, args);
                    const availability = await this.apiClient.getAvailability(eventId, ticketTypeId);
                    return { response: { availability } };
                }
                case 'requestSalesHandoff': {
                    return this.buildHandoff(botConfig, args);
                }
                default:
                    return { response: { error: `Herramienta desconocida: ${name}` } };
            }
        } catch (error) {
            logger.error('Error ejecutando tool', { tool: name, eventId, error: String(error) });
            return { response: { error: 'No se pudo obtener la información solicitada.' } };
        }
    }

    private async resolveTicketTypeId(
        eventId: string,
        args: ToolArgs,
    ): Promise<string | undefined> {
        if (typeof args.ticketTypeId === 'string' && args.ticketTypeId) {
            return args.ticketTypeId;
        }
        if (typeof args.ticketTypeName === 'string' && args.ticketTypeName) {
            const name = args.ticketTypeName.toLowerCase();
            const ticketTypes = await this.apiClient.getPublicTicketTypes(eventId);
            const match = ticketTypes.find((tt) => tt.name.toLowerCase().includes(name));
            return match?.id;
        }
        return undefined;
    }

    private async buildHandoff(
        botConfig: InternalBotConfig,
        args: ToolArgs,
    ): Promise<{ response: Record<string, unknown>; handoffUrl?: string }> {
        if (!botConfig.salesWhatsappNumber) {
            return {
                response: {
                    ok: false,
                    reason: 'Este evento no tiene un número de ventas configurado.',
                },
            };
        }

        const rawItems = Array.isArray(args.items) ? args.items : [];
        const items: SalesHandoffItem[] = rawItems
            .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
            .map((it) => ({
                ticketTypeName: String(it.ticketTypeName ?? ''),
                quantity: Number(it.quantity ?? 0),
            }))
            .filter((it) => it.ticketTypeName && it.quantity > 0);

        const event = await this.apiClient.getPublicEvent(botConfig.eventId);
        const url = buildWhatsappHandoffUrl(botConfig.salesWhatsappNumber, event.name, items);

        return {
            response: { ok: true, message: 'Enlace de WhatsApp generado para continuar la compra.' },
            handoffUrl: url,
        };
    }
}
