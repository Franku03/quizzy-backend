/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\application\commands\unregister-device\unregister-device.handler.ts

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UnregisterDeviceCommand } from './unregister-device.command';
import type { IDeviceRepository } from 'src/notifications/domain/ports/device.repository.port';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@CommandHandler(UnregisterDeviceCommand)
export class UnregisterDeviceHandler implements ICommandHandler<UnregisterDeviceCommand> {
    constructor(
        @Inject(RepositoryName.Device)
        private readonly deviceRepository: IDeviceRepository,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
        private readonly logger: ILogger,
    ) {}

    @Log()
    async execute(command: UnregisterDeviceCommand): Promise<void> {
        await this.deviceRepository.remove(
            command.userId,
            command.token,
        );
    }
}
