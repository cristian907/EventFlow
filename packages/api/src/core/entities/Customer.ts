export default class Customer {
    constructor(
        public readonly id: string,
        public readonly idNumber: string,
        public readonly fullName: string,
        public readonly phone: string | null,
        public readonly email: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}
}
