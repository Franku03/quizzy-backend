export class NotFoundError extends Error {
    constructor(notificationId: string) {
        super(`NOTIFICATION_NOT_FOUND:${notificationId}`);
        this.name = 'NotFoundError';
    }
}

export const MARK_NOTIFICATION_AS_READ_ERRORS = {
    NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
};
