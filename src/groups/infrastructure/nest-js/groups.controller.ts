import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUserId } from 'src/common/decorators/get-user-id-decorator';
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetGroupsByUserQuery } from 'src/groups/application/queries/get-groups-by-user/get-group-by-user.query';
import { GroupReadModel } from 'src/groups/application/queries/read-model/group.read.model';

import { CreateGroupDto } from 'src/groups/application/commands/request-dtos/create-group.request.dto';
import { CreateGroupCommand } from 'src/groups/application/commands/create-group/create-group.command';
import { CreateGroupResponse } from 'src/groups/application/commands/response-dtos/create-group.response.dto';

import { ModifyGroupInformationCommand } from 'src/groups/application/commands/modify-group-information/modify-group-information.command';
import { ModifyGroupResponse } from 'src/groups/application/commands/response-dtos/modify-group.response.dto';
import { UpdateGroupDto } from 'src/groups/application/commands/request-dtos/modify-group.request.dto';

import { Either } from 'src/core/types/either';
import { GROUP_ERRORS } from 'src/groups/application/commands/group.errors';

@Controller('groups')
export class GroupsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }


    // Crear un nuevo grupo
    @Post()
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.CREATED) // Status 201
    async create(
        @GetUserId() adminId: string,
        @Body() dto: CreateGroupDto,
    ) {
        const res: Either<Error, CreateGroupResponse> = await this.commandBus.execute(new CreateGroupCommand(dto.name, adminId, dto.description));
        return res.isLeft() ? this.handleError(res.getLeft()) : res.getRight();

    }

    // Obtener grupos del usuario logueado
    @Get()
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getGroupsByUser(@GetUserId() userId: string) {
        const res: Either<Error, GroupReadModel[]> = await this.queryBus.execute(new GetGroupsByUserQuery(userId));
        return res.isLeft() ? this.handleError(res.getLeft()) : res.getRight();
    }

    // Modificar información de un grupo
    @Patch(':groupId')
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.OK)
    async modifyGroupInformation(@Param('groupId') groupId: string, @GetUserId() userId: string, @Body() dto: UpdateGroupDto) {
        console.log("modifyGroupInformation", groupId, userId, dto);
        const res: Either<Error, ModifyGroupResponse> = await this.commandBus.execute(new ModifyGroupInformationCommand(groupId, userId, dto.name, dto.description));
        return res.isLeft() ? this.handleError(res.getLeft()) : res.getRight();
    }

    private handleError(error: Error): never {
        const message = error.message
        if (message.startsWith(GROUP_ERRORS.NOT_FOUND)) {
            throw new NotFoundException(message);
        }
        if (message.startsWith(GROUP_ERRORS.INVALID_DETAILS)) {
            throw new BadRequestException(message);
        }
        throw new InternalServerErrorException(error);
    }
}
