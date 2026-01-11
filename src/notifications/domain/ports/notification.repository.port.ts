import { INotification } from '../INotification';

export interface INotificationRepository {
    save(notification: INotification): Promise<void>;
    findById(id: string): Promise<INotification | null>;
    findByUserId(userId: string, limit: number, offset: number): Promise<INotification[]>;
    markAsRead(id: string): Promise<void>;
}