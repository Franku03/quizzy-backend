import { Module } from '@nestjs/common';
import { GroupsController } from './infrastructure/nest-js/groups.controller';
import { RepositoryFactoryModule } from 'src/database/infrastructure/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/repositories/repository.catalog.enum';
import { IGroupRepository } from 'src/database/domain/repositories/groups/IGroupRepository';
import { CreateGroup } from './application/use-cases/create-group.use-case';
import { IUserRepository } from 'src/database/domain/repositories/users/IUserRepository';


@Module({
    controllers: [GroupsController],
    imports: [RepositoryFactoryModule.forFeature(RepositoryName.Group), RepositoryFactoryModule.forFeature(RepositoryName.User)],
    providers: [
        {
            provide: 'CreateGroup',
            useFactory: (groupRepository: IGroupRepository, userRepository: IUserRepository) => new CreateGroup(groupRepository, userRepository),
            inject: [RepositoryName.Group, RepositoryName.User],
        },
    ],
})
export class GroupsModule { }