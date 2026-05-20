export default class User {
    constructor(
        public id: string,
        public name: string,
        public email: string,
        public passwordHash: string,
        public phoneNumber: string,
        public createdBy: string | null,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}
}
