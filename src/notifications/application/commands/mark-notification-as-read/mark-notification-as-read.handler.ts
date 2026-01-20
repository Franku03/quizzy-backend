/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\application\commands\mark-notification-as-read\mark-notification-as-read.handler.ts

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { MarkNotificationAsReadCommand } from './mark-notification-as-read.command';
import type { INotificationRepository } from 'src/notifications/domain/ports/notification.repository.port';
import type { INotification } from 'src/notifications/domain/INotification';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { NotFoundError } from 'src/notifications/application/commands/mark-notification-as-read/mark-notification-as-read.errors';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@CommandHandler(MarkNotificationAsReadCommand)
export class MarkNotificationAsReadHandler implements ICommandHandler<MarkNotificationAsReadCommand> {
    constructor(
        @Inject(RepositoryName.Notification)
        private readonly notificationRepository: INotificationRepository,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
        private readonly logger: ILogger,
    ) { }

    @Log()
    async execute(command: MarkNotificationAsReadCommand): Promise<INotification> {
        const notification = await this.notificationRepository.findById(command.notificationId);

        if (!notification) {
            throw new NotFoundError(command.notificationId);
        }

        if (notification.userId !== command.userId) {
            throw new NotFoundError(command.notificationId);
        }

        await this.notificationRepository.markAsRead(command.notificationId);

        const updatedNotification = await this.notificationRepository.findById(command.notificationId);
        if (!updatedNotification) {
            throw new NotFoundError(command.notificationId);
        }

        return updatedNotification;
    }
}
