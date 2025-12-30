// src/kahoots/application/commands/create-kahoot/create-kahoot.handler.ts

import { Inject } from '@nestjs/common';
import { CreateKahootCommand } from './create-kahootcommand';
import { KahootSlideCommand } from '../base';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';

// Core & Types
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';

// Dominio & Persistencia
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { IKahootRepository } from '../../../domain/ports/IKahootRepository';
import { KahootFactory } from '../../../domain/factories/kahoot.factory';
import { Kahoot } from '../../../domain/aggregates/kahoot';

// Response & Media (PUERTOS)
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import type { IMediaEnricher } from '../../ports/i-media-enricher.interface';
import { KAHOOT_MEDIA_ENRICHER } from '../../ports/kahoot-application.tokens';

// Servicios
import { KahootResponseService } from '../../services/kahoot-response.service';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';

@CommandHandler(CreateKahootCommand)
export class CreateKahootHandler implements ICommandHandler<CreateKahootCommand> {

  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    @Inject(KahootResponseService)
    private readonly kahootResponseService: KahootResponseService,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator<string>,
    @Inject(KAHOOT_MEDIA_ENRICHER)
    private readonly mediaEnricher: IMediaEnricher<KahootHandlerResponse>,
  ) { }

  async execute(command: CreateKahootCommand): Promise<Either<ErrorData, KahootHandlerResponse>> {
    const kahootId = await this.idGenerator.generateId();

    const errorContext = createDomainContext('Kahoot', 'createKahoot', {
      domainObjectId: kahootId,
      actorId: command.userId,
      title: command.title,
    });

    try {
      // 1. Crear el Agregado de Dominio
      const kahoot = await this.createKahoot(command, kahootId);

      // 2. Persistir
      const saveResult = await this.kahootRepository.saveKahootEither(kahoot);
      if (saveResult.isLeft()) return Either.makeLeft(saveResult.getLeft());

      // 3. MAPEO: De Dominio a Response Plano (Solo IDs)
      // Usamos el servicio que solo se encarga de transformar la estructura.
      const plainResponse = await this.kahootResponseService.toResponse(kahoot);

      // Delegamos a la estrategia inyectada a través del MediaEnricher.
      const enrichedResponse = await this.mediaEnricher.enrich(plainResponse);

      return Either.makeRight(enrichedResponse);

    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        return Either.makeLeft(
          DomainErrorFactory.validation(
            errorContext, // Usamos el contexto que creamos al inicio
            { general: [error.message] },
            `Validation error during Kahoot creation: ${error.message}`
          )
        );
      }

      return Either.makeLeft(this.handleUnexpectedError(error, errorContext));
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

  private handleUnexpectedError(error: any, context: any): ErrorData {
    if (error instanceof ErrorData) return error;

    return new ErrorData(
      "APPLICATION_UNEXPECTED_ERROR",
      `Unexpected error during Kahoot creation: ${error instanceof Error ? error.message : String(error)}`,
      ErrorLayer.APPLICATION,
      context,
      error as Error
    );
  }

}