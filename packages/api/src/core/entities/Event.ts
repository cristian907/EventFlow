export enum EventStatus {
    Draft = 'DRAFT',
    Active = 'ACTIVE',
    Cancelled = 'CANCELLED',
}

export default class Event {
    constructor(
        public id: string,
        public organizerId: string,
        public imageUrl: string,
        public name: string,
        public description: string,
        public startDate: Date,
        public endDate: Date,
        public startTime: Date,
        public endTime: Date,
        public location: string,
        public address: string,
        public maxCapacity: number,
        public status: EventStatus,
        public autoSyncBcv: boolean,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}
}
