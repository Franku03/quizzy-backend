import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { GroupsController } from './infrastructure/nest-js/groups.controller';
import { RepositoryFactoryModule } from 'src/database/infrastructure/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/repositories/repository.catalog.enum';
import { IGroupRepository } from 'src/database/domain/repositories/groups/IGroupRepository';
import { CreateGroup } from './application/use-cases/create-group.use-case';
import { IUserRepository } from 'src/database/domain/repositories/users/IUserRepository';
import { SoloAttemptCompletedListener } from './application/event-listeners/solo-attempt.listener';
import { MarkAssignmentCompletedUseCase } from './application/use-cases/mark-assignment-completed.use-case';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import type { EventBus } from 'src/core/domain/ports/event-bus.port';
import { SoloAttemptCompletedEvent } from 'src/core/domain/domain-events/attempt-completed-event';

@Module({
    controllers: [GroupsController],
    imports: [RepositoryFactoryModule.forFeature(RepositoryName.Group), RepositoryFactoryModule.forFeature(RepositoryName.User)],
    providers: [
        {
            provide: 'CreateGroup',
            useFactory: (groupRepository: IGroupRepository, userRepository: IUserRepository) => new CreateGroup(groupRepository, userRepository),
            inject: [RepositoryName.Group, RepositoryName.User],
        },
        {
            provide: MarkAssignmentCompletedUseCase,
            useFactory: (repo: IGroupRepository) => new MarkAssignmentCompletedUseCase(repo),
            inject: [RepositoryName.Group]
        },
        {
            provide: SoloAttemptCompletedListener,
            useFactory: (useCase: MarkAssignmentCompletedUseCase) => {
                return new SoloAttemptCompletedListener(useCase);
            },
            inject: [MarkAssignmentCompletedUseCase]
        }
    ],
})
export class GroupsModule implements OnModuleInit {


    constructor(
        @Inject(EVENT_BUS_TOKEN) private readonly eventBus: EventBus,
        private readonly soloAttemptCompletedListener: SoloAttemptCompletedListener
    ) { }

    onModuleInit() {
        this.eventBus.subscribe(
            SoloAttemptCompletedEvent.name,
            async (event: SoloAttemptCompletedEvent) => {
                if (event instanceof SoloAttemptCompletedEvent) {
                    await this.soloAttemptCompletedListener.on(event);
                }
            }
        );
        console.log('GroupsModule: Suscrito a SoloAttemptCompletedEvent');
    }

}