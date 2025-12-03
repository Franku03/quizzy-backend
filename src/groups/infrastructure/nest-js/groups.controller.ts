import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { CreateGroupCommand } from 'src/groups/application/commands/create-group/create-group.command';
import { GetUserId } from 'src/common/decorators/get-user-id-decorator';
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';


@Controller('groups')
export class GroupsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }


    @Post()
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.CREATED) // Status 201
    async create(
        @GetUserId() adminId: string,
        @Body() dto: CreateGroupCommand,
    ) {
        const groupId = await this.commandBus.execute(new CreateGroupCommand(dto.name, adminId));

        return {
            groupID: groupId,
            groupName: dto.name,
            adminId: adminId,
            memberCount: 1,
            createdAt: new Date(),
        };
    }
}
