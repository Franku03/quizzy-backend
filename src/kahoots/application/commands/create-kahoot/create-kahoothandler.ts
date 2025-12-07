// src/kahoots/application/commands/create-kahoot/create-kahoot.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateKahootCommand } from './create-kahootcommand';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { IKahootRepository } from '../../../domain/ports/IKahootRepository';
import type { IKahootMapper } from '../../ports/i-kahoot-mapper.port';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { KahootFactory } from '../../../domain/factories/kahoot.factory';
import { Kahoot } from '../../../domain/aggregates/kahoot';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { Either } from 'src/core/types/either';
import { CreateKahootError } from '../../errors/kahoot-aplication.errors';
import { KahootMapperService } from '../../services/kahoot.mapper.service';
import { KahootErrorMapper } from '../../errors/kahoot-error.mapper';
import { KahootAssetEnricherService } from '../../services/kahoot-asset-enricher.service';

@CommandHandler(CreateKahootCommand)
export class CreateKahootHandler 
  implements ICommandHandler<CreateKahootCommand, Either<CreateKahootError, KahootHandlerResponse>> {
    
  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    @Inject(KahootMapperService)
    private readonly kahootMapper: IKahootMapper,
    @Inject(UuidGenerator)
    private readonly idGenerator: IdGenerator<string>,
    @Inject(KahootAssetEnricherService)
    private readonly assetEnricher: KahootAssetEnricherService,
  ) {}

  async execute(command: CreateKahootCommand): Promise<Either<CreateKahootError, KahootHandlerResponse>> {
    try {
      // 1. Crear kahoot
      const kahoot = await this.createKahoot(command);
      
      // 2. Guardar
      const saveResult = await this.kahootRepository.saveKahootEither(kahoot);
      if (saveResult.isLeft()) {
        return Either.makeLeft(
          KahootErrorMapper.fromInfrastructure(
            saveResult.getLeft(),
            'create',
            { userId: command.userId, kahootId: kahoot.id.value }
          ) as CreateKahootError
        );
      }
      
      // 3. Mapear respuesta
      const snapshot = kahoot.getSnapshot();
      const response = await this.kahootMapper.fromSnapshot(snapshot);
      const enrichedResponse = await this.assetEnricher.enrich(response);
      return Either.makeRight(enrichedResponse);
      
    } catch (error) {
      return Either.makeLeft(
        KahootErrorMapper.fromAny(error, 'create', { userId: command.userId }) as CreateKahootError
      );
    }
  }

  private async createKahoot(command: CreateKahootCommand): Promise<Kahoot> {
    const creationDate = new Date().toISOString().split('T')[0];
    const kahootId = await this.idGenerator.generateId();
    
    const slides = command.slides ? 
      await Promise.all(
        command.slides.map(async (slide) => {
          const slideId = await this.idGenerator.generateId();
          const options = slide.options ? 
            await Promise.all(
              slide.options.map(async (option) => ({
                ...option,
                id: await this.idGenerator.generateId(),
              }))
            ) : [];
          
          return { ...slide, id: slideId, options };
        })
      ) : [];
    
    return KahootFactory.createFromRawInput({
      ...command,
      id: kahootId,
      authorId: command.userId,
      slides,
      createdAt: creationDate,
      playCount: 0,
    });
  }
}