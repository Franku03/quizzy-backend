/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\users.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from 'src/auth/auth.module';

import { UsersController } from './infrastructure/nest-js/users.controller';

import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

import { CreateUserHandler } from './application/commands/create-user/create-user.handler';

import { UuidGeneratorService } from './infrastructure/external-services/uuid-generator.service';
import { BcryptHasherService } from './infrastructure/external-services/bcrypt-hasher.service';
import { GetUserByIdHandler } from './application/queries/get-user-by-id/get-user-by-id.handler';
import { ChangeUsernameHandler } from './application/commands/change-username/change-username.handler';
import { DeleteUserHandler } from './application/commands/delete-user/delete-user.handler';
import { CoreModule } from 'src/core/core.module';
import { RegisterUserHandler } from './application/commands/register-user/register-user.handler';
import { UpdateProfileHandler } from './application/commands/update-profile/update-profile.handler';
import { GetUserProfileHandler } from './application/queries/get-user-profile/get-user-profile.handler';
import { GetPublicProfileIdHandler } from './application/queries/get-public-profile-id/get-public-profile-id.handler';
import { GetPublicProfileUsernameHandler } from './application/queries/get-public-profile-username/get-public-profile-username.handler';
import { GetAllUsersHandler } from './application/queries/get-all-users/get-all-users.handler';

import { MediaModule } from 'src/media/infrastructure/nest-js/media.module';

@Module({
  controllers: [UsersController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.User), 
    DaoFactoryModule.forFeature(DaoName.User), 
    CqrsModule,
    CoreModule,
    forwardRef(() => AuthModule),
    MediaModule,
  ],
  providers: [
    CreateUserHandler,
    GetUserByIdHandler,
    ChangeUsernameHandler,
    DeleteUserHandler,
    RegisterUserHandler,
    UpdateProfileHandler,
    GetUserProfileHandler,
    GetPublicProfileIdHandler,
    GetPublicProfileUsernameHandler,
    GetAllUsersHandler,
    {
      provide: 'IUuidGenerationService',
      useClass: UuidGeneratorService,
    },
    {
      provide: 'IPasswordHasher',
      useClass: BcryptHasherService,
    },
  ],

  exports: [
    RepositoryFactoryModule,
    'IPasswordHasher',
  ],
})
export class UsersModule {}