import { Module } from '@nestjs/common';
import { SubscriptionController } from './infrastructure/nest-js/subscription.controller';
import { GetSubscriptionStatusHandler } from './application/queries/get-user-subscription/get-subscription-status.handler';
import { UsersModule } from 'src/users/users.module';
import { UpgradeToPremiumHandler } from './application/commands/upgrade-to-premium/upgrade-to-premium.handler';
import { CancelSubscriptionHandler } from './application/commands/cancel-subscription/cancel-subscription.handler';

@Module({
  imports: [
    UsersModule,
  ],
  controllers: [SubscriptionController],
  providers: [
    GetSubscriptionStatusHandler,
    UpgradeToPremiumHandler,
    CancelSubscriptionHandler,
  ],
})
export class SubscriptionModule {}