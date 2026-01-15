import type { INotificationRepository } from 'src/notifications/domain/ports/notification.repository.port';
import type { INotification } from 'src/notifications/domain/INotification';
import type { IDeviceRepository } from 'src/notifications/domain/ports/device.repository.port';
import type { INotifier } from 'src/notifications/application/ports/notifier.port';
import type { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';
import { KahootAssignedEvent } from 'src/core/domain/domain-events/kahoot-assigned.event';

export class NotifyKahootAssignedUseCase {
    constructor(
        private readonly notificationRepository: INotificationRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly notifier: INotifier,
        private readonly idGenerator: IdGenerator<string>,
    ) { }

    async execute(event: KahootAssignedEvent): Promise<void> {
        for (const memberId of event.memberIds) {
            const notificationId = await this.idGenerator.generateId();

            const notification: INotification = {
                id: notificationId,
                userId: memberId,
                type: 'KAHOOT_ASSIGNED',
                title: '🧠 Nuevo desafío asignado',
                body: `El usuario ${event.assignerName} asignó el kahoot "${event.kahootTitle}" al grupo ${event.groupName}.`,
                resourceId: event.kahootId,
                isRead: false,
                createdAt: event.occurredOn || new Date(),
            };

            await this.notificationRepository.save(notification);

            const deviceTokens = await this.deviceRepository.findTokensByUserId(memberId);
            if (deviceTokens.length > 0) {
                await this.notifier.sendToUser(
                    deviceTokens,
                    notification.title,
                    notification.body,
                    {
                        type: notification.type,
                        resourceId: notification.resourceId || '',
                        notificationId: notification.id,
                    }
                );
            }
        }
    }
}
