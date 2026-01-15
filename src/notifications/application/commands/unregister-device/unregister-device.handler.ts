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
