import { EventType } from '@eventflow/shared';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface EventContextType {
    currentEvent: EventType | null;
    eventRole: string | null;
    setEventContext: (event: EventType | null, role: string | null) => void;
    isLoadingEvent: boolean;
    setIsLoadingEvent: (loading: boolean) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
    const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
    const [eventRole, setEventRole] = useState<string | null>(null);
    const [isLoadingEvent, setIsLoadingEvent] = useState(false);

    const setEventContext = useCallback((event: EventType | null, role: string | null) => {
        setCurrentEvent(event);
        setEventRole(role);
    }, []);

    const value = useMemo(
        () => ({ currentEvent, eventRole, setEventContext, isLoadingEvent, setIsLoadingEvent }),
        [currentEvent, eventRole, setEventContext, isLoadingEvent],
    );

    return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvent() {
    const context = useContext(EventContext);
    if (context === undefined) {
        throw new Error('useEvent must be used within an EventProvider');
    }
    return context;
}
