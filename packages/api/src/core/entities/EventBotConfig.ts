export default class EventBotConfig {
    constructor(
        public id: string,
        public eventId: string,
        public telegramBotTokenEncrypted: string | null,
        public salesWhatsappNumber: string | null,
        public salesHandoffMessage: string | null,
        public welcomeMessage: string | null,
        public isEnabled: boolean,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}
}
