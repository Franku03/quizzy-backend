/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\infrastructure\nestjs\backoffice.controller.ts

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Query,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from 'src/core/infrastructure/cqrs';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { ValidRoles } from 'src/auth/infrastructure/interfaces/jwt-payload.interface';
import { BackofficeUserPaginationDto } from './dtos/backoffice-user-pagination.dto';
import { BackofficeMassNotificationPaginationDto } from './dtos/backoffice-mass-notifications-pagination.dto';
import { SendMassNotificationDto } from './dtos/send-mass-notification-body.dto';
import { BlockUserCommand } from 'src/backoffice/application/commands/block-user/block-user.command';
import { Either, ErrorData } from 'src/core/types';
import {
  BackOfficeUserPaginationReadModel,
  BackOfficeUserReadModel,
} from 'src/backoffice/application/read-model/backoffice-user.read.model';
import { UnblockUserCommand } from 'src/backoffice/application/commands/unblock-user/unblock-user.command';
import { GiveAdminCommand } from 'src/backoffice/application/commands/give-admin/give-admin.command';
import { RemoveAdminCommand } from 'src/backoffice/application/commands/remove-admin/remove-admin.command';
import { DeleteUserCommand } from 'src/backoffice/application/commands/delete-user/delete-user.command';
import {
  BackofficeNotificationPaginationReadModel,
  BackofficeNotificationReadModel,
} from 'src/backoffice/application/read-model/backoffice-notifications.read.model';
import { ResendEmailService } from './external-services/extra-send-message.service';
import { SendSingleEmailDto } from './dtos/extra-send-message.dto';

@Controller('backoffice')
export class BackofficeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly sendSingleMailService: ResendEmailService,
  ) {}

  // Obtener lista de usuarios
  @HttpCode(200)
  @Auth(ValidRoles.ADMIN)
  @Get('users')
  async getBackofficeUsersList(
    @GetUserId() adminId: string,
    @Query() paginationDto: BackofficeUserPaginationDto,
  ) {
    const response: Either<ErrorData, BackOfficeUserPaginationReadModel> =
      await this.queryBus.execute(paginationDto.toGetBackofficeUsersQuery());
    return response;
  }

  // Bloquear un Usuario
  @HttpCode(200)
  @Auth(ValidRoles.ADMIN)
  @Patch('blockUser/:userId')
  async blockUser(
    @GetUserId() adminId: string,
    @Param('userId') userToBeBlockedId: string,
  ) {
    const response: Either<ErrorData, BackOfficeUserReadModel> =
      await this.commandBus.execute(
        new BlockUserCommand(adminId, userToBeBlockedId),
      );
    return response;
  }

  // Desbloquear un Usuario
  @HttpCode(200)
  @Auth(ValidRoles.ADMIN)
  @Patch('unblockUser/:userId')
  async unblockUser(
    @GetUserId() adminId: string,
    @Param('userId') userToBeUnblockedId: string,
  ) {
    const response: Either<ErrorData, BackOfficeUserReadModel> =
      await this.commandBus.execute(
        new UnblockUserCommand(adminId, userToBeUnblockedId),
      );
    return response;
  }

  // Dar Permisos de Admin a un usuario
  @HttpCode(200)
  @Auth(ValidRoles.ADMIN)
  @Patch('giveAdmin/:userId')
  async giveAdmin(
    @GetUserId() adminId: string,
    @Param('userId') userToGiveAdminId: string,
  ) {
    const response: Either<ErrorData, BackOfficeUserReadModel> =
      await this.commandBus.execute(
        new GiveAdminCommand(adminId, userToGiveAdminId),
      );
    return response;
  }

  // Quitar Permisos de Admin a un usuario
  @HttpCode(200)
  @Auth(ValidRoles.ADMIN)
  @Patch('/removeAdmin/:userId')
  async RemoveAdmin(
    @GetUserId() adminId: string,
    @Param('userId') userToRemoveFromAdminId: string,
  ) {
    const response: Either<ErrorData, BackOfficeUserReadModel> =
      await this.commandBus.execute(
        new RemoveAdminCommand(adminId, userToRemoveFromAdminId),
      );
    return response;
  }

  // Eliminar un Usuario
  @HttpCode(204)
  @Auth(ValidRoles.ADMIN)
  @Delete('/user/:userId')
  async DeleteUser(
    @GetUserId() adminId: string,
    @Param('userId') userToDeleteId: string,
  ) {
    const response: Either<ErrorData, BackOfficeUserReadModel> =
      await this.commandBus.execute(
        new DeleteUserCommand(adminId, userToDeleteId),
      );
    if (response.isLeft())
      return Either.makeLeft<ErrorData, void>(response.getLeft());
  }

  // Enviar Notficacion en Masa (FALTA TOMAR EL BODY DE LA REQUEST)
  @HttpCode(201)
  @Auth(ValidRoles.ADMIN)
  @Post('/massNotification')
  async sendMassNotificacion(
    @GetUserId() adminId: string,
    @Body() sendMessageDto: SendMassNotificationDto,
  ) {
    const response: Either<ErrorData, BackofficeNotificationReadModel> =
      await this.commandBus.execute(
        sendMessageDto.toSendMassNotificationCommand(adminId),
      );
    return response;
  }

  // Obtener lista mensajes masivos enviados
  @HttpCode(200)
  @Auth(ValidRoles.ADMIN)
  @Get('massNotifications')
  async getMassNotificationsList(
    @GetUserId() adminId: string,
    @Query() paginationDto: BackofficeMassNotificationPaginationDto,
  ) {
    const response: Either<
      ErrorData,
      BackofficeNotificationPaginationReadModel
    > = await this.queryBus.execute(
      paginationDto.toGetMassNotificationsQuery(),
    );
    return response;
  }

  @Post('sendMessage')
  @HttpCode(200)
  @Auth(ValidRoles.ADMIN)
  async sendSingleEmail(@Body() dto: SendSingleEmailDto) {
    await this.sendSingleMailService.sendSingleEmail(dto);
    return {
      success: true,
      message: 'Email enviado correctamente',
      recipient: dto.email,
    };
  }
}
