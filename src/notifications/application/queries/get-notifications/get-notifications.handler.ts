import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetNotificationsQuery } from './get-notifications.query';
import type { INotificationRepository } from 'src/notifications/domain/ports/notification.repository.port';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { NotificationReadModel } from '../read-models/notification.read.model';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@QueryHandler(GetNotificationsQuery)
export class GetNotificationsHandler implements IQueryHandler<GetNotificationsQuery> {
    constructor(
        @Inject(RepositoryName.Notification)
        private readonly notificationRepository: INotificationRepository,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
        private readonly logger: ILogger,
    ) { }

    @Log()
    async execute(query: GetNotificationsQuery): Promise<NotificationReadModel[]> {
        const offset = (query.page - 1) * query.limit;

        const notifications = await this.notificationRepository.findByUserId(
            query.userId,
            query.limit,
            offset,
        );

        return notifications.map(notification =>
            new NotificationReadModel(
                notification.id,
                notification.type,
                notification.body,
                notification.isRead,
                notification.createdAt.toISOString(),
                notification.resourceId,
            )
        );
    }
}
