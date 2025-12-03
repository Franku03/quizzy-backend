import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { CreateGroupCommand } from 'src/groups/application/commands/create-group/create-group.command';
import { GetUserId } from 'src/common/decorators/get-user-id-decorator';
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetGroupsByUserQuery } from 'src/groups/application/queries/get-groups-by-user/get-group-by-user.query';


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

        // pending: refactorizar 
        return {
            groupID: groupId,
            groupName: dto.name,
            adminId: adminId,
            memberCount: 1,
            createdAt: new Date(),
        };
    }


    @Get()
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getGroupsByUser(@GetUserId() userId: string) {
        const groups = await this.queryBus.execute(new GetGroupsByUserQuery(userId));
        if (!groups.hasValue()) throw new NotFoundException();
        return groups.getValue();
    }
}
