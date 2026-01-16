/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\subscription\subscription.module.ts

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