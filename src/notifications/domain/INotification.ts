export interface INotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    resourceId?: string;
    isRead: boolean;
    createdAt: Date;
}