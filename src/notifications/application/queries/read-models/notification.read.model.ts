export class NotificationReadModel {
    constructor(
        public readonly id: string,
        public readonly type: string,
        public readonly message: string,
        public readonly isRead: boolean,
        public readonly createdAt: string,
        public readonly resourceId?: string,
    ) {}
}
