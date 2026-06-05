import 'dotenv/config';

function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`La variable de entorno ${name} es obligatoria pero no está definida.`);
    }
    return value;
}

function intEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
    apiBaseUrl: required('API_BASE_URL'),
    internalApiKey: required('INTERNAL_API_KEY'),
    geminiApiKey: required('GEMINI_API_KEY'),
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    botPollIntervalMs: intEnv('BOT_POLL_INTERVAL_MS', 30_000),
    conversationTtlMs: intEnv('CONVERSATION_TTL_MS', 1_800_000),
    rateLimitWindowMs: intEnv('RATE_LIMIT_WINDOW_MS', 10_000),
    rateLimitMaxMessages: intEnv('RATE_LIMIT_MAX_MESSAGES', 5),
    maxGeminiTurns: intEnv('MAX_GEMINI_TURNS', 20),
    logLevel: process.env.LOG_LEVEL ?? 'info',
} as const;
