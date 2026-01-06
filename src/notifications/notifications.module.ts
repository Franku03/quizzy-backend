import { Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationsController } from './infrastructure/nest-js/notifications.controller';
import { NotificationService } from './application/services/notification.service';

@Module({
    controllers: [NotificationsController],
    imports: [
        CqrsModule,
    ],
    providers: [
        {
            provide: 'INotificationService',
            useClass: NotificationService,
        },
    ],
})

export class NotificationsModule implements OnModuleInit {

    onModuleInit() {
        console.log('NotificationsModule initialized');
    }
}
