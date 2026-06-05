import {
    InternalBotConfig,
    PublicAvailability,
    PublicEvent,
    PublicTicketType,
} from '@eventflow/shared';
import axios, { AxiosInstance } from 'axios';

import { config } from '../config';

export default class ApiClient {
    private http: AxiosInstance;

    constructor() {
        this.http = axios.create({
            baseURL: config.apiBaseUrl,
            timeout: 10_000,
            headers: { 'X-Internal-Api-Key': config.internalApiKey },
        });
    }

    async getConfigs(): Promise<InternalBotConfig[]> {
        const { data } = await this.http.get<{ configs: InternalBotConfig[] }>(
            '/api/internal/bot/configs',
        );
        return data.configs;
    }

    async getPublicEvent(eventId: string): Promise<PublicEvent> {
        const { data } = await this.http.get<{ event: PublicEvent }>(
            `/api/events/${eventId}/public`,
        );
        return data.event;
    }

    async getPublicTicketTypes(eventId: string): Promise<PublicTicketType[]> {
        const { data } = await this.http.get<{ ticketTypes: PublicTicketType[] }>(
            `/api/events/${eventId}/public/ticket-types`,
        );
        return data.ticketTypes;
    }

    async getAvailability(eventId: string, ticketTypeId?: string): Promise<PublicAvailability[]> {
        const { data } = await this.http.get<{ availability: PublicAvailability[] }>(
            `/api/events/${eventId}/public/availability`,
            { params: ticketTypeId ? { ticketTypeId } : undefined },
        );
        return data.availability;
    }
}
