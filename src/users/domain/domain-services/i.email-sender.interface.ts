export interface IEmailSender {
    sendPasswordChangedNotification(email: string): Promise<void>;
}