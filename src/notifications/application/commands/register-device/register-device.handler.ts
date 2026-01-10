import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RegisterDeviceCommand } from './register-device.command';
import type { IDeviceRepository } from 'src/notifications/domain/ports/device.repository.port';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@CommandHandler(RegisterDeviceCommand)
export class RegisterDeviceHandler implements ICommandHandler<RegisterDeviceCommand> {
    constructor(
        @Inject('IDeviceRepository')
        private readonly deviceRepository: IDeviceRepository,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
        private readonly logger: ILogger,
    ) { }

    @Log()
    async execute(command: RegisterDeviceCommand): Promise<void> {
        await this.deviceRepository.register(
            command.userId,
            command.token,
            command.deviceType,
        );
    }
}
