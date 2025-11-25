import { Module } from '@nestjs/common';
import { UsersController } from './infrastructure/nestJs/users.controller';
import { CreateUser } from './application/use-cases/CreateUser';
import { RepositoryName } from 'src/database/infrastructure/repositories/repository.catalog.enum';
import { IUserRepository } from 'src/database/domain/repositories/users/IUserRepository';
import { RepositoryFactoryModule } from 'src/database/infrastructure/repository.factory.module';

@Module({
  controllers: [UsersController],
  imports: [RepositoryFactoryModule.forFeature(RepositoryName.User)],
  providers: [
    {
      provide: 'CreateUser',
      useFactory: (repository: IUserRepository) => new CreateUser(repository),
      inject: [RepositoryName.User],
    },
  ],
})
export class UsersModule {}
