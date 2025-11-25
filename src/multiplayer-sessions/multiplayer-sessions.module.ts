import { Module } from '@nestjs/common';
import { MultiplayerSessionsController, MultiplayerSessionsGateway, MultiplayerSessionsService } from './infrastructure/nest-js';

@Module({
  providers: [
    MultiplayerSessionsGateway, 
    MultiplayerSessionsService
  ],
  controllers: [MultiplayerSessionsController],
})
export class MultiplayerSessionsModule {}
