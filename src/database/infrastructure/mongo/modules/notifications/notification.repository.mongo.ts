import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INotification } from 'src/notifications/domain/INotification';
import { INotificationRepository } from 'src/notifications/domain/ports/notification.repository.port';
import { NotificationMongo } from '../../entities/notifications.schema';
import { RepositoryMongo } from '../../decorators/repository-mongo.decorator';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@RepositoryMongo(RepositoryName.Notification)
@Injectable()
export class NotificationRepositoryMongo implements INotificationRepository {
    constructor(
        @InjectModel(NotificationMongo.name)
        private readonly model: Model<NotificationMongo>
    ) { }

    async save(notification: INotification): Promise<void> {
        await this.model.create({
            notificationId: notification.id,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            resourceId: notification.resourceId,
            isRead: notification.isRead,
            createdAt: notification.createdAt
        });
    }

    async findById(id: string): Promise<INotification | null> {
        const doc = await this.model.findOne({ notificationId: id }).lean().exec();
        if (!doc) return null;
        return this.mapToDomain(doc);
    }

    async findByUserId(userId: string, limit: number, offset: number): Promise<INotification[]> {
        const docs = await this.model.find({ userId })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean()
            .exec();

        return docs.map(doc => this.mapToDomain(doc));
    }

    async markAsRead(id: string): Promise<void> {
        await this.model.updateOne(
            { notificationId: id },
            { $set: { isRead: true } }
        ).exec();
    }

    private mapToDomain(doc: any): INotification {
        return {
            id: doc.notificationId,
            userId: doc.userId,
            type: doc.type,
            title: doc.title,
            body: doc.body,
            resourceId: doc.resourceId || undefined,
            isRead: doc.isRead,
            createdAt: doc.createdAt
        };
    }
}