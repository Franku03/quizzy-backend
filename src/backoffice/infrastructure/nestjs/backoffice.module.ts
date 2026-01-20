/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\infrastructure\nestjs\backoffice.module.ts

import { Module } from '@nestjs/common';
import { BackofficeController } from './backoffice.controller';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { MediaModule } from 'src/media/infrastructure/nest-js/media.module';
import { BlockUserHandler } from 'src/backoffice/application/commands/block-user/block-user.handler';
import { UnblockUserHandler } from 'src/backoffice/application/commands/unblock-user/unblock-user.handler';
import { GiveAdminHandler } from 'src/backoffice/application/commands/give-admin/give-admin.handler';
import { RemoveAdminHandler } from 'src/backoffice/application/commands/remove-admin/remove-admin.handler';
import { DeleteUserHasherService } from 'src/users/infrastructure/external-services/deleted-user-hasher.service';
import { DeleteUserHandler } from 'src/backoffice/application/commands/delete-user/delete-user.handler';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { GetBackofficeUsersHandler } from 'src/backoffice/application/queries/get-backoffice-users/get-backoffice-users.handler';
import { GetMassNotificationsHandler } from 'src/backoffice/application/queries/get-mass-notifications/get-mass-notifications.handler';
import { VerifyIfUserIsAdminService } from './domain-services/verify-if-user-is-admin.service';
import { SendMassNotificationHandler } from 'src/backoffice/application/commands/send-mass-notification/send-mass-notification.handler';
import { ResendNotificationService } from './external-services/resend-notification.service';
import { ResendEmailService } from './external-services/extra-send-message.service';

@Module({
  imports: [
    DaoFactoryModule.forFeature(DaoName.Backoffice),
    RepositoryFactoryModule.forFeature(RepositoryName.User),
    RepositoryFactoryModule.forFeature(RepositoryName.MassMessage),
    MediaModule,
  ],
  controllers: [BackofficeController],
  providers: [
    BlockUserHandler,
    UnblockUserHandler,
    GiveAdminHandler,
    RemoveAdminHandler,
    DeleteUserHandler,
    GetBackofficeUsersHandler,
    GetMassNotificationsHandler,
    SendMassNotificationHandler,
    {
      provide: 'IDeletedUserHasher',
      useClass: DeleteUserHasherService,
    },
    {
      provide: 'IVerifyIfUserIsAdminService',
      useClass: VerifyIfUserIsAdminService,
    },
    {
      provide: 'ISendNotificationService',
      useClass: ResendNotificationService,
    },
    ResendEmailService,
  ],
})
export class BackofficeModule {}
