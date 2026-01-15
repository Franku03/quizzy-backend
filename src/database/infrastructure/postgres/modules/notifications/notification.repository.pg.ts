/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationRepository } from 'src/notifications/domain/ports/notification.repository.port';
import { NotificationEntity } from '../../entities/notifications/notification.entity.pg';
import { INotification } from 'src/notifications/domain/INotification';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@RepositoryPostgres(RepositoryName.Notification)
@Injectable()
export class NotificationRepository implements INotificationRepository {
    constructor(
        @InjectRepository(NotificationEntity)
        private readonly notificationRepository: Repository<NotificationEntity>,
    ) { }

    async save(notification: INotification): Promise<void> {
        const entity = {
            notificationId: notification.id,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            resourceId: notification.resourceId,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
        };

        await this.notificationRepository.save(entity);
    }

    async findById(id: string): Promise<INotification | null> {
        const entity = await this.notificationRepository.findOne({
            where: { notificationId: id }
        });

        if (!entity) {
            return null;
        }

        return this.mapToDomain(entity);
    }

    async findByUserId(userId: string, limit: number, offset: number): Promise<INotification[]> {
        const entities = await this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });

        return entities.map(entity => this.mapToDomain(entity));
    }

    async markAsRead(id: string): Promise<void> {
        await this.notificationRepository.update(
            { notificationId: id },
            { isRead: true }
        );
    }

    private mapToDomain(entity: NotificationEntity): INotification {
        return {
            id: entity.notificationId,
            userId: entity.userId,
            type: entity.type,
            title: entity.title,
            body: entity.body,
            resourceId: entity.resourceId || undefined,
            isRead: entity.isRead,
            createdAt: entity.createdAt,
        };
    }
}
