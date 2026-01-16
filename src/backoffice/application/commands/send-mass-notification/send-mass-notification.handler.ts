/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\application\commands\send-mass-notification\send-mass-notification.handler.ts

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { User } from 'src/users/domain/aggregates/user';
import { SendMassNotificationCommand } from './send-mass-notification.command';
import type { IMassMessageRepository } from 'src/backoffice/domain/ports/IMassMessageRepository';
import { BackofficeNotificationReadModel } from '../../read-model/backoffice-notifications.read.model';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import type { IVerifyIfUserIsAdminService } from 'src/backoffice/domain/domain-services/verify-if-user-is-admin.service.interface';
import type { ISendNotificationService } from 'src/backoffice/domain/domain-services/send-notification.service.interface';
import { MassMessageId } from 'src/core/domain/shared-value-objects/id-objects/mass-message.id';
import { MassMessage } from 'src/backoffice/domain/aggregates/mass.message';
import { MessageContent } from 'src/backoffice/domain/value-objects/message.content';
import { Filters } from 'src/backoffice/domain/value-objects/filters';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import type { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';
import { BackofficeNotificationReadModelBuilder } from '../../helpers/backoffice-notification-user-read-model.builder';

@CommandHandler(SendMassNotificationCommand)
export class SendMassNotificationHandler implements ICommandHandler<SendMassNotificationCommand> {
  constructor(
    private readonly mediaService: MediaEnrichmentService,
    @Inject(RepositoryName.User)
    private readonly userRepo: IUserRepository,
    @Inject(RepositoryName.MassMessage)
    private readonly massMessageRepo: IMassMessageRepository,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
    @Inject('IVerifyIfUserIsAdminService')
    private readonly verifyIfUserIsAdminService: IVerifyIfUserIsAdminService,
    @Inject('ISendNotificationService')
    private readonly sendMassNotificationService: ISendNotificationService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR)
    private readonly idGenerator: IdGenerator<string>,
  ) {}

  private readonly context = {
    useCase: 'sendMassNotification',
    module: 'backoffice',
  };

  @Log()
  async execute(
    command: SendMassNotificationCommand,
  ): Promise<Either<ErrorData, BackofficeNotificationReadModel>> {
    return pipeAsync<ErrorData, BackofficeNotificationReadModel>(
      // 1. Buscar el usuario admin que envía la notificación
      this.findAdminUser(command.senderId),

      // 2. Crear los value objects y el MassMessage
      (adminUserResult) => this.createMassMessage(adminUserResult, command),

      // 3. Enviar la notificación
      (massMessageResult) => this.sendNotification(massMessageResult),

      // 4. Guardar el mensaje en el repositorio
      (massMessageResult) => this.saveMassMessage(massMessageResult),

      // 5. Crear el BackofficeNotificationReadModel
      (massMessageResult) =>
        this.createNotificationReadModel(massMessageResult, command.senderId),

      // 6. Aplicar enriquecimiento de media (avatar del sender)
      (result) =>
        result.mapAsync((readModel) =>
          this.mediaService.enrinchBackofficeNotificationReadModel(readModel),
        ),
    );
  }

  /**
   * Paso 1: Buscar el usuario admin que envía la notificación
   */
  private async findAdminUser(
    senderId: string,
  ): Promise<Either<ErrorData, User>> {
    try {
      // Crear UserId desde el string
      const adminUserId = UserId.create(senderId);

      if (adminUserId.isLeft()) {
        return Either.makeLeft(adminUserId.getLeft());
      }

      // Usar el repositorio para buscar el usuario
      const adminUserResult = await this.userRepo.findUserByIdEither(
        adminUserId.getRight(),
      );

      if (adminUserResult.isLeft()) {
        return Either.makeLeft(adminUserResult.getLeft());
      }

      const adminUser = adminUserResult.getRight();

      if (!adminUser) {
        const errorData = new ErrorData(
          '404',
          'Sender user not found',
          ErrorLayer.APPLICATION,
          {
            ...this.context,
            senderId,
          },
        );
        return Either.makeLeft(errorData);
      }

      // Verificar que el usuario no esté eliminado
      if (adminUser.isDeleted) {
        const errorData = new ErrorData(
          '400',
          'Sender user is deleted',
          ErrorLayer.APPLICATION,
          {
            ...this.context,
            senderId,
          },
        );
        return Either.makeLeft(errorData);
      }

      // Verificar que el usuario esté activo
      if (adminUser.isBlocked()) {
        const errorData = new ErrorData(
          '400',
          'Sender user is blocked',
          ErrorLayer.APPLICATION,
          {
            ...this.context,
            senderId,
          },
        );
        return Either.makeLeft(errorData);
      }

      return Either.makeRight(adminUser);
    } catch (error) {
      const errorData = new ErrorData(
        'FIND_ADMIN_ERROR',
        error instanceof Error ? error.message : 'Failed to find admin user',
        ErrorLayer.APPLICATION,
        {
          ...this.context,
          senderId,
          errorDetails: error instanceof Error ? error.message : String(error),
        },
      );
      return Either.makeLeft(errorData);
    }
  }

  /**
   * Paso 2: Crear los value objects y el MassMessage
   */
  private async createMassMessage(
    adminUserResult: Either<ErrorData, User>,
    command: SendMassNotificationCommand,
  ): Promise<Either<ErrorData, MassMessage>> {
    if (adminUserResult.isLeft()) {
      return Either.makeLeft(adminUserResult.getLeft());
    }

    const adminUser = adminUserResult.getRight();

    try {
      // CORRECCIÓN: Crear MassMessageId directamente con el constructor
      const massMessageId = new MassMessageId(this.idGenerator.generateId());

      // NOTA: MassMessageId no es un Either, es un Value Object simple
      // que ya tiene su validación interna en el constructor

      // Crear UserId para el autor
      const authorIdResult = UserId.create(adminUser.id.value);

      if (authorIdResult.isLeft()) {
        return Either.makeLeft(authorIdResult.getLeft());
      }

      // Crear MessageContent
      const messageContentResult = MessageContent.create(
        command.title,
        command.message,
      );

      if (messageContentResult.isLeft()) {
        return Either.makeLeft(messageContentResult.getLeft());
      }

      // Crear Filters
      const filtersResult = Filters.create(
        command.toAdmins,
        command.toRegularUsers,
      );

      if (filtersResult.isLeft()) {
        return Either.makeLeft(filtersResult.getLeft());
      }

      // Crear DateISO para createdAt
      const createdAt = DateISO.createFrom(new Date().toISOString());

      // Crear las props del agregado
      const props = {
        massMessageId: massMessageId, // Ya no es un Either, es el objeto directamente
        author: authorIdResult.getRight(),
        content: messageContentResult.getRight(),
        filter: filtersResult.getRight(),
        createdAt,
      };

      // Crear el agregado MassMessage
      const massMessageEither = await MassMessage.create(
        props,
        massMessageId, // Ya no es un Either
        this.verifyIfUserIsAdminService,
      );

      if (massMessageEither.isLeft()) {
        return Either.makeLeft(massMessageEither.getLeft());
      }

      return Either.makeRight(massMessageEither.getRight());
    } catch (error) {
      const errorData = new ErrorData(
        'MASS_MESSAGE_CREATION_ERROR',
        error instanceof Error
          ? error.message
          : 'Failed to create mass message',
        ErrorLayer.DOMAIN,
        {
          ...this.context,
          senderId: adminUser.id.value,
          senderName: adminUser.userProfileDetails.name,
          title: command.title,
          errorDetails: error instanceof Error ? error.message : String(error),
        },
      );
      return Either.makeLeft(errorData);
    }
  }

  /**
   * Paso 3: Enviar la notificación
   */
  private async sendNotification(
    massMessageResult: Either<ErrorData, MassMessage>,
  ): Promise<Either<ErrorData, MassMessage>> {
    if (massMessageResult.isLeft()) {
      return Either.makeLeft(massMessageResult.getLeft());
    }

    const massMessage = massMessageResult.getRight();

    // Enviar la notificación (esto se ejecuta en segundo plano)
    const sendResult = await massMessage.send(this.sendMassNotificationService);

    if (sendResult.isLeft()) {
      // IMPORTANTE: Si falla el envío, igualmente retornamos el massMessage
      // porque la creación fue exitosa. El error de envío se maneja en background.

      // Continuamos con el flujo aunque falle el envío
      // porque el mensaje ya fue creado exitosamente
      return Either.makeRight(massMessage);
    }

    return Either.makeRight(massMessage);
  }

  /**
   * Paso 4: Guardar el mensaje en el repositorio
   */
  private async saveMassMessage(
    massMessageResult: Either<ErrorData, MassMessage>,
  ): Promise<Either<ErrorData, MassMessage>> {
    if (massMessageResult.isLeft()) {
      return Either.makeLeft(massMessageResult.getLeft());
    }

    const massMessage = massMessageResult.getRight();

    try {
      // Guardar el mensaje en el repositorio
      const saveResult = await this.massMessageRepo.save(massMessage);

      if (saveResult.isLeft()) {
        return Either.makeLeft(saveResult.getLeft());
      }

      return Either.makeRight(massMessage);
    } catch (error) {
      const errorData = new ErrorData(
        'SAVE_MASS_MESSAGE_ERROR',
        error instanceof Error ? error.message : 'Failed to save mass message',
        ErrorLayer.INFRASTRUCTURE,
        {
          ...this.context,
          massMessageId: massMessage.massMessageId.value,
          errorDetails: error instanceof Error ? error.message : String(error),
        },
      );
      return Either.makeLeft(errorData);
    }
  }

  /**
   * Paso 5: Crear el BackofficeNotificationReadModel
   */
  private async createNotificationReadModel(
    massMessageResult: Either<ErrorData, MassMessage>,
    senderId: string,
  ): Promise<Either<ErrorData, BackofficeNotificationReadModel>> {
    if (massMessageResult.isLeft()) {
      return Either.makeLeft(massMessageResult.getLeft());
    }

    const massMessage = massMessageResult.getRight();

    try {
      // Obtener información del sender (admin) para el read model
      const adminUserIdResult = UserId.create(senderId);

      if (adminUserIdResult.isLeft()) {
        const errorData = new ErrorData(
          '400',
          'Invalid sender ID for read model',
          ErrorLayer.DOMAIN,
          {
            ...this.context,
            senderId,
          },
        );
        return Either.makeLeft(errorData);
      }

      const adminUserResult = await this.userRepo.findUserByIdEither(
        adminUserIdResult.getRight(),
      );

      if (adminUserResult.isLeft()) {
        return Either.makeLeft(adminUserResult.getLeft());
      }

      const adminUser = adminUserResult.getRight();

      if (!adminUser) {
        const errorData = new ErrorData(
          '404',
          'Sender user not found for read model',
          ErrorLayer.APPLICATION,
          {
            ...this.context,
            senderId,
          },
        );
        return Either.makeLeft(errorData);
      }

      // Usar el builder para crear el read model
      const notificationReadModelBuilder =
        new BackofficeNotificationReadModelBuilder()
          .withId(massMessage.massMessageId.value)
          .withTitle(massMessage.getTitle())
          .withMessage(massMessage.getMessage())
          .withCreatedAt(massMessage.createdAt.value)
          .withSenderDetails(
            adminUser.id.value,
            adminUser.userProfileDetails.name,
            adminUser.email.value,
            adminUser.userProfileDetails.avatarAssetId || null,
          );

      return Either.makeRight(notificationReadModelBuilder.build());
    } catch (error) {
      const errorData = new ErrorData(
        'READ_MODEL_CREATION_ERROR',
        error instanceof Error
          ? error.message
          : 'Failed to create notification read model',
        ErrorLayer.APPLICATION,
        {
          ...this.context,
          massMessageId: massMessage.massMessageId.value,
          errorDetails: error instanceof Error ? error.message : String(error),
        },
      );
      return Either.makeLeft(errorData);
    }
  }
}
