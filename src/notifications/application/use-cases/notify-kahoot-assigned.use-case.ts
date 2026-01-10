import type { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import type { INotificationRepository } from 'src/notifications/domain/ports/notification.repository.port';
import type { INotification } from 'src/notifications/domain/INotification';
import type { IDeviceRepository } from 'src/notifications/domain/ports/device.repository.port';
import type { INotifier } from 'src/notifications/application/ports/notifier.port';
import type { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';

export class NotifyKahootAssignedUseCase {
    constructor(
        private readonly groupRepository: IGroupRepository,
        private readonly kahootRepository: IKahootRepository,
        private readonly userRepository: IUserRepository,
        private readonly notificationRepository: INotificationRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly notifier: INotifier,
        private readonly idGenerator: IdGenerator<string>,
    ) { }

    async execute(data: {
        groupId: string;
        kahootId: string;
        assignedBy: string;
        availableFrom: Date;
        availableUntil: Date;
    }): Promise<void> {
        const groupOptional = await this.groupRepository.findById(data.groupId);
        if (!groupOptional.hasValue()) {
            return;
        }

        const group = groupOptional.getValue();
        const members = group.getMembers();
        const membersToNotify = members.filter(
            member => member.getUserId().value !== data.assignedBy
        );

        const kahootOptional = await this.kahootRepository.findKahootByIdEither(data.kahootId);
        if (kahootOptional.isLeft()) {
            return;
        }

        const kahoot = kahootOptional.getRight();
        if (!kahoot) {
            return;
        }

        const kahootDetails = kahoot.details;
        const kahootTitle = kahootDetails.hasValue()
            ? kahootDetails.getValue().title.hasValue()
                ? kahootDetails.getValue().title.getValue()
                : 'Sin título'
            : 'Sin título';

        const userOptional = await this.userRepository.findById(new UserId(data.assignedBy));
        if (!userOptional.hasValue()) {
            return;
        }

        const user = userOptional.getValue();
        const userName = user.username.value;

        for (const member of membersToNotify) {
            const memberId = member.getUserId().value;
            const notificationId = await this.idGenerator.generateId();

            const notification: INotification = {
                id: notificationId,
                userId: memberId,
                type: 'KAHOOT_ASSIGNED',
                title: '🧠 Nuevo desafío asignado',
                body: `El usuario ${userName} asignó el kahoot "${kahootTitle}" al grupo ${group.getName()}.`,
                resourceId: data.kahootId,
                isRead: false,
                createdAt: new Date(),
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
