/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\infrastructure\nest-js\groups.controller.ts

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Delete } from '@nestjs/common';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

import { GetGroupsByUserQuery } from 'src/groups/application/queries/get-groups-by-user/get-group-by-user.query';
import { GroupReadModel } from 'src/groups/application/queries/read-model/group.read.model';

import { CreateGroupDto } from 'src/groups/application/commands/request-dtos/create-group.request.dto';
import { CreateGroupCommand } from 'src/groups/application/commands/create-group/create-group.command';
import { CreateGroupResponse } from 'src/groups/application/commands/response-dtos/create-group.response.dto';

import { ModifyGroupInformationCommand } from 'src/groups/application/commands/modify-group-information/modify-group-information.command';
import { ModifyGroupResponse } from 'src/groups/application/commands/response-dtos/modify-group.response.dto';
import { UpdateGroupDto } from 'src/groups/application/commands/request-dtos/modify-group.request.dto';

import { GenerateInvitationDto } from 'src/groups/application/commands/request-dtos/generate-invitation.request.dto';
import { GenerateInvitationCommand } from 'src/groups/application/commands/generate-invitation/generate-invitation.command';
import { InvitationResponse } from 'src/groups/application/commands/response-dtos/generate-invitation.response.dto';

import { JoinGroupDto } from 'src/groups/application/commands/request-dtos/join-group.request.dto';
import { JoinGroupCommand } from 'src/groups/application/commands/join-group/join-group.command';
import { JoinGroupResponse } from 'src/groups/application/commands/response-dtos/join-group.response.dto';
import { DeleteMemberCommand } from 'src/groups/application/commands/delete-member/delete-member.command';
import { DeleteGroupCommand } from 'src/groups/application/commands/delete-group/delete-group.command';

import { AssignKahootToGroupDto } from 'src/groups/application/commands/request-dtos/assign-kahoot.request.dto';
import { AssignKahootToGroupCommand } from 'src/groups/application/commands/assign-kahoot/assign-kahoot.command';
import { AssignKahootToGroupResponse } from 'src/groups/application/commands/response-dtos/assign-kahoot.response.dto';

import { TransferAdminDto } from 'src/groups/application/commands/request-dtos/transfer-admin.request.dto';
import { TransferAdminCommand } from 'src/groups/application/commands/transfer-admin/transfer-admin.command';
import { TransferAdminResponse } from 'src/groups/application/commands/response-dtos/transfer-admin.response.dto';

import { GetGroupLeaderboardQuery } from 'src/groups/application/queries/get-leaderboard/get-group-leaderboard.query';
import { GroupLeaderboardReadModel } from 'src/groups/application/queries/read-model/group.leaderboard.model';
import { KahootLeaderboardReadModel } from 'src/groups/application/queries/read-model/kahoot.leaderboard.model';
import { GetKahootLeaderboardQuery } from 'src/groups/application/queries/get-kahoot-leaderboard/get-kahoot-leaderboard.query';
import { GetGroupQuizzesQuery } from 'src/groups/application/queries/get-group-quizzes/get-group-quizzes.query';
import { GroupQuizAssignmentReadModel } from 'src/groups/application/queries/read-model/group.quiz.assignment.model';
import { GetGroupMembersQuery } from 'src/groups/application/queries/get-group-members/get-group-members.query';
import { GroupMemberReadModel } from 'src/groups/application/queries/read-model/group.member.read.model';



@Controller('groups')
export class GroupsController {
    constructor(
        private readonly executor: CommandQueryExecutorService,
    ) { }


    // Crear un nuevo grupo
    @Post()
    @Auth()
    @HttpCode(HttpStatus.CREATED) // Status 201
    async create(
        @GetUserId() adminId: string,
        @Body() dto: CreateGroupDto,
    ): Promise<CreateGroupResponse> {
        const command = new CreateGroupCommand(dto.name, adminId, dto.description);
        return await this.executor.executeCommand<CreateGroupResponse>(command);
    }

    // Obtener grupos del usuario logueado
    @Get()
    @Auth()
    @HttpCode(HttpStatus.OK)
    async getGroupsByUser(@GetUserId() userId: string): Promise<GroupReadModel[]> {
        const query = new GetGroupsByUserQuery(userId);
        return await this.executor.executeQuery<GroupReadModel[]>(query);
    }

    // Modificar información de un grupo
    @Patch(':groupId')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async modifyGroupInformation(
        @Param('groupId') groupId: string,
        @GetUserId() userId: string,
        @Body() dto: UpdateGroupDto
    ): Promise<ModifyGroupResponse> {
        const command = new ModifyGroupInformationCommand(groupId, userId, dto.name, dto.description);
        return await this.executor.executeCommand<ModifyGroupResponse>(command);
    }


    // Generar invitación para un grupo
    @Post(':groupId/invitations')
    @Auth()
    @HttpCode(HttpStatus.CREATED)
    async generateInvitation(
        @Param('groupId') groupId: string,
        @GetUserId() adminId: string,
        @Body() dto: GenerateInvitationDto
    ): Promise<InvitationResponse> {
        const command = new GenerateInvitationCommand(groupId, adminId, parseInt(dto.expiresIn));
        return await this.executor.executeCommand<InvitationResponse>(command);
    }

    // Unirse a un grupo
    @Post('/join')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async joinGroup(
        @GetUserId() userId: string,
        @Body() dto: JoinGroupDto
    ): Promise<JoinGroupResponse> {
        const command = new JoinGroupCommand(userId, dto.invitationToken);
        return await this.executor.executeCommand<JoinGroupResponse>(command);
    }


    // Eliminar un miembro de un grupo
    @Delete(':groupId/members/:targetUserId')
    @Auth()
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteMember(
        @Param('groupId') groupId: string,
        @Param('targetUserId') targetUserId: string,
        @GetUserId() userId: string
    ): Promise<void> {
        const command = new DeleteMemberCommand(groupId, userId, targetUserId);
        await this.executor.executeCommand<void>(command);
    }

    // Eliminar un grupo
    @Delete(':groupId')
    @Auth()
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteGroup(
        @Param('groupId') groupId: string,
        @GetUserId() userId: string
    ): Promise<void> {
        const command = new DeleteGroupCommand(groupId, userId);
        await this.executor.executeCommand<void>(command);
    }


    // Asignar un kahoot a un grupo
    @Post(':groupId/quizzes')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async assignKahootToGroup(
        @Param('groupId') groupId: string,
        @GetUserId() userId: string,
        @Body() dto: AssignKahootToGroupDto
    ): Promise<AssignKahootToGroupResponse> {
        const command = new AssignKahootToGroupCommand(groupId, userId, dto.quizId, dto.availableFrom, dto.availableUntil);
        return await this.executor.executeCommand<AssignKahootToGroupResponse>(command);
    }


    // Transferir el admin de un grupo
    @Patch(':groupId/transfer-admin')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async transferAdmin(
        @Param('groupId') groupId: string,
        @GetUserId() userId: string,
        @Body() dto: TransferAdminDto
    ): Promise<TransferAdminResponse> {
        const command = new TransferAdminCommand(groupId, userId, dto.newAdminId);
        return await this.executor.executeCommand<TransferAdminResponse>(command);
    }

    // Obtener el leaderboard de un grupo
    @Get(':groupId/leaderboard')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async getGroupLeaderboard(
        @Param('groupId') groupId: string,
        @GetUserId() userId: string,
    ): Promise<GroupLeaderboardReadModel[]> {
        const query = new GetGroupLeaderboardQuery(userId, groupId);
        return await this.executor.executeQuery<GroupLeaderboardReadModel[]>(query);
    }

    // Obtener el leaderboard de un kahoot
    @Get(':groupId/quizzes/:quizId/leaderboard')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async getKahootLeaderboard(
        @Param('groupId') groupId: string,
        @Param('quizId') quizId: string,
        @GetUserId() userId: string,
    ): Promise<KahootLeaderboardReadModel[]> {
        const query = new GetKahootLeaderboardQuery(userId, groupId, quizId);
        return await this.executor.executeQuery<KahootLeaderboardReadModel[]>(query);
    }

    // Obtener los quizzes asignados al grupo con su status y resultados
    @Get(':groupId/quizzes')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async getGroupQuizzes(
        @Param('groupId') groupId: string,
        @GetUserId() userId: string,
    ): Promise<{ data: GroupQuizAssignmentReadModel[] }> {
        const query = new GetGroupQuizzesQuery(userId, groupId);
        const quizzes = await this.executor.executeQuery<GroupQuizAssignmentReadModel[]>(query);
        return { data: quizzes };
    }

    // Obtener los miembros de un grupo
    @Get(':groupId/members')
    @Auth()
    @HttpCode(HttpStatus.OK)
    async getGroupMembers(
        @Param('groupId') groupId: string,
        @GetUserId() userId: string,
    ): Promise<GroupMemberReadModel[]> {
        const query = new GetGroupMembersQuery(userId, groupId);
        return await this.executor.executeQuery<GroupMemberReadModel[]>(query);
    }
}
