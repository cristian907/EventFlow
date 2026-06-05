import { Content } from '@google/genai';

import { config } from '../config';

interface Conversation {
    history: Content[];
    lastSeen: number;
}

export default class ConversationStore {
    private conversations = new Map<string, Conversation>();
    private pruneTimer: NodeJS.Timeout;

    constructor() {
        this.pruneTimer = setInterval(() => this.prune(), config.conversationTtlMs);
        this.pruneTimer.unref();
    }

    getHistory(chatId: string): Content[] {
        const conv = this.conversations.get(chatId);
        if (!conv) return [];
        if (Date.now() - conv.lastSeen > config.conversationTtlMs) {
            this.conversations.delete(chatId);
            return [];
        }
        return conv.history;
    }

    setHistory(chatId: string, history: Content[]): void {
        const maxEntries = config.maxGeminiTurns * 2;
        const trimmed = history.length > maxEntries ? history.slice(-maxEntries) : history;
        this.conversations.set(chatId, { history: trimmed, lastSeen: Date.now() });
    }

    reset(chatId: string): void {
        this.conversations.delete(chatId);
    }

    private prune(): void {
        const now = Date.now();
        for (const [chatId, conv] of this.conversations.entries()) {
            if (now - conv.lastSeen > config.conversationTtlMs) {
                this.conversations.delete(chatId);
            }
        }
    }

    stop(): void {
        clearInterval(this.pruneTimer);
        this.conversations.clear();
    }
}
