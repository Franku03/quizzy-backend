import { INotification } from "../INotification";

export interface INotificationRepository {
    save(notification: INotification): Promise<void>;
    markAsRead(id: string): Promise<boolean>;
    findByUserId(userId: string, limit: number, offset: number): Promise<INotification[]>;
}