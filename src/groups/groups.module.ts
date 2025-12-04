import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { GroupsController } from './infrastructure/nest-js/groups.controller';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { CreateGroupHandler } from './application/commands/create-group/create-group.handler';
import { SoloAttemptCompletedListener } from './application/event-listeners/solo-attempt.listener';
import { MarkAssignmentCompletedUseCase } from './application/use-cases/mark-assignment-completed.use-case';
import { EVENT_BUS_TOKEN } from 'src/core/domain/ports/event-bus.token';
import type { EventBus } from 'src/core/domain/ports/event-bus.port';
import { SoloAttemptCompletedEvent } from 'src/core/domain/domain-events/attempt-completed-event';
import { CqrsModule } from '@nestjs/cqrs';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GetGroupsByUserHandler } from './application/queries/get-groups-by-user/get-group-by-user.handler';
import { ModifyGroupInformationHandler } from './application/commands/modify-group-information/modify-group-information.handler';
import { GenerateInvitationHandler } from './application/commands/generate-invitation/generate-invitation.handler';
import { UuidTokenGenerator } from './infrastructure/adapters/uuid-token.generator';
import { JoinGroupHandler } from './application/commands/join-group/join-group.handler';
@Module({
    controllers: [GroupsController],
    imports: [
        CqrsModule,
        RepositoryFactoryModule.forFeature(RepositoryName.Group),
        RepositoryFactoryModule.forFeature(RepositoryName.User),
        DaoFactoryModule.forFeature(DaoName.Group)
    ],
    providers: [
        CreateGroupHandler,
        GetGroupsByUserHandler,
        ModifyGroupInformationHandler,
        GenerateInvitationHandler,
        JoinGroupHandler,
        {
            provide: 'ITokenGenerator',
            useClass: UuidTokenGenerator,
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
        //console.log('GroupsModule: Suscrito a SoloAttemptCompletedEvent');
    }

}