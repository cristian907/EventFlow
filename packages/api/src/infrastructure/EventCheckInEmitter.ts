import { EventEmitter } from 'events';

import { CheckInEvent } from '@eventflow/shared';

class EventCheckInEmitter extends EventEmitter {
    publishCheckIn(eventId: string, event: CheckInEvent): void {
        this.emit(`check-in:${eventId}`, event);
    }

    subscribeCheckIn(eventId: string, listener: (event: CheckInEvent) => void): () => void {
        const handler = (event: CheckInEvent): void => listener(event);
        this.on(`check-in:${eventId}`, handler);
        return () => {
            this.off(`check-in:${eventId}`, handler);
        };
    }
}

export const eventCheckInEmitter = new EventCheckInEmitter();
export default eventCheckInEmitter;
