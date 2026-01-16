/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\create-group\create-group.handler.ts

import { Group } from "../../../domain/aggregates/group";
import type { IGroupRepository } from "src/groups/domain/ports/IGroupRepository";
import { v4 as uuidv4 } from 'uuid';
import { CreateGroupCommand } from "./create-group.command";
import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { CreateGroupResponse } from "../response-dtos/create-group.response.dto";
import { GROUP_ERRORS } from "../group.errors";
import { EVENT_BUS_TOKEN } from "src/core/domain/ports/event-bus.token";
import type { EventBus } from "src/core/domain/ports/event-bus.port";
import { GroupCreatedEvent } from "src/core/domain/domain-events/group-created.event";
import { ICommandHandler } from "src/core/application/cqrs/command-handler.interface";
import { CommandHandler } from "src/core/infrastructure/cqrs/decorators/command-handler.decorator";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import type { IUserRepository } from "src/users/domain/ports/IUserRepository";



@CommandHandler(CreateGroupCommand)
export class CreateGroupHandler implements ICommandHandler<CreateGroupCommand> {
    private readonly useCase: string = 'User creates a new group';
    // Inyectamos el Puerto del Repositorio (no el DAO, el Repositorio de Agregados)
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
        @Inject(RepositoryName.User)
        private readonly userRepository: IUserRepository,
        @Inject(EVENT_BUS_TOKEN)
        private readonly eventBus: EventBus,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
    ) { }

    @Log()
    async execute(command: CreateGroupCommand): Promise<Either<ErrorData, CreateGroupResponse>> {
        const groupId = uuidv4();
        const errorContext = createDomainContext('Group', 'createGroup', {
            domainObjectId: groupId,
            actorId: command.adminId,
            userId: command.adminId,
            name: command.name,
        });

        if (!command.adminId) {
            return Either.makeLeft(
                DomainErrorFactory.validation(
                    errorContext,
                    { adminId: [GROUP_ERRORS.ADMIN_REQUIRED] },
                    GROUP_ERRORS.ADMIN_REQUIRED
                )
            );
        }


        const admin = await this.userRepository.findById(new UserId(command.adminId));


        if (!admin) {
            return Either.makeLeft(
                DomainErrorFactory.notFound(
                    { ...errorContext, domainObjectType: 'User', domainObjectId: command.adminId },
                    GROUP_ERRORS.USER_NOT_FOUND
                )
            );
        }

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
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            if (error instanceof Error && error.message.includes('validation')) {
                return Either.makeLeft(
                    DomainErrorFactory.validation(
                        errorContext,
                        { general: [error.message] },
                        GROUP_ERRORS.INVALID_DETAILS
                    )
                );
            }

            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during group creation: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );

            return Either.makeLeft(unexpectedError);
        }
    }
}
