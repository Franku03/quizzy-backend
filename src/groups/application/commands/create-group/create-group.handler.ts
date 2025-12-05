import { Group } from "../../../domain/aggregates/group";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { v4 as uuidv4 } from 'uuid';
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateGroupCommand } from "./create-group.command";
import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Either } from "src/core/types/either";
import { CreateGroupResponse } from "../response-dtos/create-group.response.dto";
import { GROUP_ERRORS } from "../group.errors";
import { EVENT_BUS_TOKEN } from "src/core/domain/ports/event-bus.token";
import type { EventBus } from "src/core/domain/ports/event-bus.port";
import { GroupCreatedEvent } from "src/core/domain/domain-events/group-created.event";

@CommandHandler(CreateGroupCommand)
export class CreateGroupHandler implements ICommandHandler<CreateGroupCommand> {
    // Inyectamos el Puerto del Repositorio (no el DAO, el Repositorio de Agregados)
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(EVENT_BUS_TOKEN)
        private readonly eventBus: EventBus,
    ) { }

    async execute(command: CreateGroupCommand): Promise<Either<Error, CreateGroupResponse>> {

        if (!command.adminId)
            return Either.makeLeft(new Error(GROUP_ERRORS.ADMIN_REQUIRED));

        // pending: descomentar cuando se tenga el repositorio de usuarios
        //const admin = await this.userRepository.findById(new UserId(command.adminId));
        const admin = true

        if (!admin) {
            return Either.makeLeft(new Error(GROUP_ERRORS.USER_NOT_FOUND));
        }

        const groupId = uuidv4();

        try {
            const group = Group.create(groupId, command.name, command.adminId, command.description);
            await this.groupRepository.save(group);

            const event = new GroupCreatedEvent(groupId, command.adminId);
            await this.eventBus.publish([event]);
            console.log(`[EventBus] Evento publicado: ${GroupCreatedEvent.name}`);

            return Either.makeRight({
                id: groupId,
                name: group.getName(),
                description: group.getDescription(),
                createdAt: new Date(),
            });

        } catch (error) {
            return Either.makeLeft(new Error(GROUP_ERRORS.INVALID_DETAILS));
        }
    }
}
