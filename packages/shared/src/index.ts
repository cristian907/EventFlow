// Example shared utilities and types
export interface Event {
    id: string;
    name: string;
    date: string;
    description?: string;
}

export const formatEventDate = (date: Date): string => {
    return date.toISOString();
};

export const validateEvent = (event: Event): boolean => {
    return Boolean(event.id && event.name && event.date);
};

export * from './schemas/index';
export * from './types/index';
export * from './utils/currency';
export * from './utils/salesHandoff';
