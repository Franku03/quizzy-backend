import { ICommandService } from "src/core/application/service/application-service.interface";
import { CreateGroupDto } from "../dtos/create-group.dto"; // O commands/create-group.command
import { Group } from "../../domain/aggregates/group";
import { IGroupRepository } from "src/database/domain/repositories/groups/IGroupRepository";
import { IUserRepository } from "src/database/domain/repositories/users/IUserRepository";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { v4 as uuidv4 } from 'uuid';





export class CreateGroup implements ICommandService<CreateGroupDto> {

    constructor(
        private readonly groupRepository: IGroupRepository,
        private readonly userRepository: IUserRepository
    ) { }


    async execute(command: CreateGroupDto): Promise<string> {
        if (!command.adminId) {
            throw new Error("El adminId es requerido para crear un grupo.");
        }


        console.log("command", command);

        //const admin = await this.userRepository.findById(new UserId(command.adminId));

        const admin = true

        if (!admin) {
            throw new Error(`El usuario con ID ${command.adminId} no existe.`);
        }

        const groupId = uuidv4();

        const group = Group.create(groupId, command.name, command.adminId);

        await this.groupRepository.save(group);

        return groupId;
    }
}