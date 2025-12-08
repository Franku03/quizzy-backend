// src/kahoots/application/commands/create-kahoot/create-kahoot.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateKahootCommand } from './create-kahootcommand';
import { KahootSlideCommand } from '../base';

// Importaciones Universales y de Core
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';

// Importaciones de Dominio y Puertos
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { IKahootRepository } from '../../../domain/ports/IKahootRepository';
import { KahootFactory } from '../../../domain/factories/kahoot.factory';
import { Kahoot } from '../../../domain/aggregates/kahoot';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';

// Servicios
import { KahootResponseService } from '../../services/kahoot-response.service';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';

@CommandHandler(CreateKahootCommand)
export class CreateKahootHandler
  implements ICommandHandler<CreateKahootCommand, Either<ErrorData, KahootHandlerResponse>> {

  private readonly logger = new Logger(CreateKahootHandler.name);

  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    @Inject(KahootResponseService)
    private readonly kahootResponseService: KahootResponseService,
    @Inject(UuidGenerator)
    private readonly idGenerator: IdGenerator<string>,
  ) { }

  async execute(command: CreateKahootCommand): Promise<Either<ErrorData, KahootHandlerResponse>> {
    const kahootId = await this.idGenerator.generateId();

    // Contexto de error reutilizable
    const errorContext = createDomainContext('Kahoot', 'createKahoot', {
      domainObjectId: kahootId,
      actorId: command.userId,
      userId: command.userId,
      title: command.title,
    });

    try {
      // 1. Crear kahoot
      const kahoot = await this.createKahoot(command, kahootId);

      // 2. Guardar
      const saveResult = await this.kahootRepository.saveKahootEither(kahoot);

      if (saveResult.isLeft()) {
        const error = saveResult.getLeft();
        this.logger.error(`Error saving new kahoot ${kahoot.id.value}`, {
          errorType: error.code,
          details: error.details
        });
        return Either.makeLeft(error);
      }

      // 3. Obtener respuesta enriquecida usando el servicio de respuesta
      const enrichedResponse = await this.kahootResponseService.toResponse(kahoot);

      return Either.makeRight(enrichedResponse);

    } catch (error) {
      // Manejo de errores de Dominio o de Runtime
      if (error instanceof ErrorData) {
        this.logger.warn(`Kahoot creation failed due to Domain/Mapeo failure. Code: ${error.code}`, error);
        return Either.makeLeft(error);
      }

      // Validaciones de dominio
      if (error instanceof Error && error.message.includes('validation')) {
        return Either.makeLeft(
          DomainErrorFactory.validation(
            errorContext,
            { general: [error.message] },
            `Validation error: ${error.message}`
          )
        );
      }

      // Error inesperado de aplicación
      const unexpectedError = new ErrorData(
        "APPLICATION_UNEXPECTED_ERROR",
        `Unexpected error during Kahoot creation: ${error instanceof Error ? error.message : String(error)}`,
        ErrorLayer.APPLICATION,
        errorContext,
        error as Error
      );

      this.logger.error('Unexpected runtime error in CreateKahootHandler', unexpectedError);
      return Either.makeLeft(unexpectedError);
    }
  }

  private async createKahoot(command: CreateKahootCommand, kahootId: string): Promise<Kahoot> {
    const creationDate = new Date().toISOString().split('T')[0];

    const slides = command.slides
      ? await this.processSlidesWithIds(command.slides)
      : [];

    return KahootFactory.createFromRawInput({
      ...command,
      id: kahootId,
      authorId: command.userId,
      slides,
      createdAt: creationDate,
      playCount: 0,
    });
  }

  private async processSlidesWithIds(
    rawSlides: KahootSlideCommand[]
  ): Promise<any[]> {
    if (!rawSlides) return [];

    return Promise.all(
      rawSlides.map(async (slide) => {
        const slideId = await this.idGenerator.generateId();
        const options = slide.options || [];
        return { ...slide, id: slideId, options };
      })
    );
  }
}