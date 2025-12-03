import { Group } from "../../../domain/aggregates/group";
import type { IGroupRepository } from "src/database/domain/repositories/groups/IGroupRepository";
import { v4 as uuidv4 } from 'uuid';
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateGroupCommand } from "./create-group.command";
import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { BadRequestException } from "@nestjs/common";

@CommandHandler(CreateGroupCommand)
export class CreateGroupHandler implements ICommandHandler<CreateGroupCommand> {
    // Inyectamos el Puerto del Repositorio (no el DAO, el Repositorio de Agregados)
    constructor(
        @Inject(RepositoryName.Group)
        private readonly groupRepository: IGroupRepository,
    ) { }

    async execute(command: CreateGroupCommand): Promise<string> {
        if (!command.adminId) {
            throw new Error("El adminId es requerido para crear un grupo.");
        }
        //const admin = await this.userRepository.findById(new UserId(command.adminId));

        const admin = true

        if (!admin) {
            throw new Error(`El usuario con ID ${command.adminId} no existe.`);
        }

        const groupId = uuidv4();

        try {
            const group = Group.create(groupId, command.name, command.adminId);
            await this.groupRepository.save(group);
        } catch (error) {
            throw new BadRequestException(error.message);
        }


        return groupId;
    }
}
