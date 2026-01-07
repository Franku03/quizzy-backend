import { Controller } from '@nestjs/common';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly executor: CommandQueryExecutorService,
    ) { }
}