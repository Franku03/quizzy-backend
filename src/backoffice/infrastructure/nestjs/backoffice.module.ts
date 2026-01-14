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

@Module({
  imports: [
    DaoFactoryModule.forFeature(DaoName.Backoffice),
    RepositoryFactoryModule.forFeature(RepositoryName.User),
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
    {
      provide: 'IDeletedUserHasher',
      useClass: DeleteUserHasherService,
    },
  ],
})
export class BackofficeModule {}
