import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, InternalServerErrorException, NotFoundException, Param, Patch, Post, UseGuards, Delete } from '@nestjs/common';
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
import { GenerateInvitationDto } from 'src/groups/application/commands/request-dtos/generate-invitation.request.dto';
import { GenerateInvitationCommand } from 'src/groups/application/commands/generate-invitation/generate-invitation.command';
import { InvitationResponse } from 'src/groups/application/commands/response-dtos/generate-invitation.response.dto';

import { JoinGroupDto } from 'src/groups/application/commands/request-dtos/join-group.request.dto';
import { JoinGroupCommand } from 'src/groups/application/commands/join-group/join-group.command';
import { JoinGroupResponse } from 'src/groups/application/commands/response-dtos/join-group.response.dto';
import { DeleteMemberCommand } from 'src/groups/application/commands/delete-member/delete-member.command';


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


    // Generar invitación para un grupo
    @Post(':groupId/invitations')
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async generateInvitation(
        @Param('groupId') groupId: string,
        @GetUserId() adminId: string,
        @Body() dto: GenerateInvitationDto
    ) {
        const res: Either<Error, InvitationResponse> = await this.commandBus.execute(new GenerateInvitationCommand(groupId, adminId, parseInt(dto.expiresIn)));
        return res.isLeft() ? this.handleError(res.getLeft()) : res.getRight();
    }

    // Unirse a un grupo
    @Post('/join')
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.OK)
    async joinGroup(@GetUserId() userId: string, @Body() dto: JoinGroupDto) {
        const res: Either<Error, JoinGroupResponse> = await this.commandBus.execute(new JoinGroupCommand(userId, dto.invitationToken));
        return res.isLeft() ? this.handleError(res.getLeft()) : res.getRight();
    }


    // Eliminar un miembro de un grupo
    @Delete(':groupId/members/:targetUserId')
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteMember(@Param('groupId') groupId: string, @Param('targetUserId') targetUserId: string, @GetUserId() userId: string) {
        const res: Either<Error, void> = await this.commandBus.execute(new DeleteMemberCommand(groupId, userId, targetUserId));
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
        if (message.startsWith(GROUP_ERRORS.NOT_ADMIN)) {
            throw new ForbiddenException(message);
        }
        if (message.startsWith(GROUP_ERRORS.NOT_MEMBER)) {
            throw new ForbiddenException(message);
        }
        if (message.startsWith(GROUP_ERRORS.INVALID_INVITATION_TOKEN)) {
            throw new BadRequestException(message);
        }
        if (message.startsWith(GROUP_ERRORS.ALREADY_MEMBER)) {
            throw new BadRequestException(message);
        }
        if (message.startsWith(GROUP_ERRORS.CANNOT_DELETE_ADMIN)) {
            throw new ForbiddenException(message);
        }
        throw new InternalServerErrorException(error.message);
    }
}
