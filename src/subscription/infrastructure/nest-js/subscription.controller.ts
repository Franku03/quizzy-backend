import { Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';

import { GetSubscriptionStatusQuery } from 'src/subscription/application/queries/get-user-subscription/get-subscription-status.query';
import { UpgradeToPremiumCommand } from 'src/subscription/application/commands/upgrade-to-premium/upgrade-to-premium.command';

import { SubscriptionReadModel } from 'src/subscription/application/queries/read-models/subscription.read.model';
import { CancelSubscriptionCommand } from 'src/subscription/application/commands/cancel-subscription/cancel-subscription.command';

@Controller('subscription')
export class SubscriptionController {
  
  constructor(
    private readonly executor: CommandQueryExecutorService,
  ) {}

  @Get()
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getSubscriptionStatus(@GetUserId() userId: string) {
    const query = new GetSubscriptionStatusQuery(userId);

    const subscriptionReadModel = await this.executor.executeQuery<SubscriptionReadModel>(query);

    return subscriptionReadModel;
  }

  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async upgradeToPremium(@GetUserId() userId: string) {
    const command = new UpgradeToPremiumCommand(userId);
    
    const result = await this.executor.executeCommand<SubscriptionReadModel>(command);
    
    return result;
  }

  @Delete()
  @Auth()
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@GetUserId() userId: string) {
    const command = new CancelSubscriptionCommand(userId);
    
    return await this.executor.executeCommand<SubscriptionReadModel>(command);
  }
  
}