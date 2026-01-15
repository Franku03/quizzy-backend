import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationsController } from './infrastructure/nest-js/notifications.controller';
import { NotificationService } from './application/services/notification.service';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { KahootAssignedListener } from './application/event-listeners/kahoot-assigned.listener';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import type { EventBus } from 'src/core/domain/ports/event-bus.port';
import { KahootAssignedEvent } from 'src/core/domain/domain-events/kahoot-assigned.event';
import { FirebaseNotifierAdapter } from './infrastructure/adapters/firebase-notifier.adapter';
import { NotifyKahootAssignedUseCase } from './application/use-cases/notify-kahoot-assigned.use-case';
import type { INotificationRepository } from 'src/notifications/domain/ports/notification.repository.port';
import type { IDeviceRepository } from 'src/notifications/domain/ports/device.repository.port';
import type { INotifier } from 'src/notifications/application/ports/notifier.port';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationMongo, NotificationSchema } from 'src/database/infrastructure/mongo/entities/notifications.schema';
import { DeviceTokenMongo, DeviceTokenSchema } from 'src/database/infrastructure/mongo/entities/devices.schema';
import 'src/database/infrastructure/mongo/modules/notifications/notification.repository.mongo';
import { RegisterDeviceHandler } from './application/commands/register-device/register-device.handler';
import { UnregisterDeviceHandler } from './application/commands/unregister-device/unregister-device.handler';
import { MarkNotificationAsReadHandler } from './application/commands/mark-notification-as-read/mark-notification-as-read.handler';
import { GetNotificationsHandler } from './application/queries/get-notifications/get-notifications.handler';

@Module({
    controllers: [NotificationsController],
    imports: [
        CqrsModule,
        RepositoryFactoryModule.forFeature(RepositoryName.Notification),
        RepositoryFactoryModule.forFeature(RepositoryName.Device),
        MongooseModule.forFeature([
            { name: NotificationMongo.name, schema: NotificationSchema },
            { name: DeviceTokenMongo.name, schema: DeviceTokenSchema },
        ]),
    ],
    providers: [
        {
            provide: 'INotificationService',
            useClass: NotificationService,
        },
        {
            provide: 'INotifier',
            useClass: FirebaseNotifierAdapter,
        },
        {
            provide: NotifyKahootAssignedUseCase,
            useFactory: (
                notificationRepository: INotificationRepository,
                deviceRepository: IDeviceRepository,
                notifier: INotifier,
                idGenerator: IdGenerator<string>,
            ) => {
                return new NotifyKahootAssignedUseCase(
                    notificationRepository,
                    deviceRepository,
                    notifier,
                    idGenerator,
                );
            },
            inject: [
                RepositoryName.Notification,
                RepositoryName.Device,
                'INotifier',
                APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR,
            ],
        },
        {
            provide: KahootAssignedListener,
            useFactory: (useCase: NotifyKahootAssignedUseCase) => {
                return new KahootAssignedListener(useCase);
            },
            inject: [NotifyKahootAssignedUseCase],
        },
        RegisterDeviceHandler,
        UnregisterDeviceHandler,
        MarkNotificationAsReadHandler,
        GetNotificationsHandler,
    ],
})

export class NotificationsModule implements OnModuleInit {
    constructor(
        @Inject(EVENT_BUS_TOKEN) private readonly eventBus: EventBus,
        private readonly kahootAssignedListener: KahootAssignedListener,
    ) { }

    onModuleInit() {
        this.eventBus.subscribe(
            KahootAssignedEvent.name,
            async (event: KahootAssignedEvent) => {
                if (event instanceof KahootAssignedEvent) {
                    await this.kahootAssignedListener.on(event);
                }
            }
        );
    }
}
