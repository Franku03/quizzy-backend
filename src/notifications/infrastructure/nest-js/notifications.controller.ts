import {
    Controller,
    Post,
    Delete,
    Get,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { RegisterDeviceDto } from './dtos/register-device.dto';
import { UnregisterDeviceDto } from './dtos/unregister-device.dto';
import { UpdateNotificationDto } from './dtos/update-notification.dto';
import { NotificationPaginationDto } from './dtos/pagination.dto';
import { RegisterDeviceCommand } from 'src/notifications/application/commands/register-device/register-device.command';
import { UnregisterDeviceCommand } from 'src/notifications/application/commands/unregister-device/unregister-device.command';
import { MarkNotificationAsReadCommand } from 'src/notifications/application/commands/mark-notification-as-read/mark-notification-as-read.command';
import { GetNotificationsQuery } from 'src/notifications/application/queries/get-notifications/get-notifications.query';
import { NotificationReadModel } from 'src/notifications/application/queries/read-models/notification.read.model';
import { MARK_NOTIFICATION_AS_READ_ERRORS } from 'src/notifications/application/commands/mark-notification-as-read/mark-notification-as-read.errors';
import type { INotification } from 'src/notifications/domain/INotification';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    @Post('register-device')
    @Auth()
    @HttpCode(HttpStatus.CREATED)
    async registerDevice(
        @GetUserId() userId: string,
        @Body() dto: RegisterDeviceDto,
    ) {
        await this.commandBus.execute(
            new RegisterDeviceCommand(userId, dto.token, dto.deviceType),
        );
        return { message: 'Device registered successfully' };
    }

    @Delete('unregister-device')
    @Auth()
    @HttpCode(HttpStatus.NO_CONTENT)
    async unregisterDevice(
        @GetUserId() userId: string,
        @Body() dto: UnregisterDeviceDto,
    ) {
        await this.commandBus.execute(
            new UnregisterDeviceCommand(userId, dto.token),
        );
    }

    @Get()
    @Auth()
    @HttpCode(HttpStatus.OK)
    async getNotifications(
        @GetUserId() userId: string,
        @Query() pagination: NotificationPaginationDto,
    ): Promise<NotificationReadModel[]> {
        const limit = pagination.limit ?? 20;
        const page = pagination.page ?? 1;
        const query = new GetNotificationsQuery(userId, limit, page);
        return await this.queryBus.execute(query);
    }

    @Patch(':id')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async markNotificationAsRead(
        @GetUserId() userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateNotificationDto,
    ) {
        if (dto.isRead !== true) {
            throw new BadRequestException('Only setting isRead to true is supported.');
        }

        try {
            const notification: INotification = await this.commandBus.execute(
                new MarkNotificationAsReadCommand(id, userId),
            );

            return {
                id: notification.id,
                type: notification.type,
                message: notification.body,
                isRead: notification.isRead,
                createdAt: notification.createdAt.toISOString(),
                resourceId: notification.resourceId,
            };
        } catch (error) {
            const errorMessage = (error as Error).message;

            if (errorMessage.includes(MARK_NOTIFICATION_AS_READ_ERRORS.NOTIFICATION_NOT_FOUND)) {
                throw new NotFoundException('Notification not found or does not belong to the user');
            }

            throw error;
        }
    }
}