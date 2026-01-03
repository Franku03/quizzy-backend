// src/kahoots/application/commands/create-kahoot/create-kahoot.handler.ts

// --- Nest & CQRS ---
import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';

// --- Core Logic & Errors ---
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { createKahootAppContext } from '../context/base-kahoot-context';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { MAPPER_TOKEN } from 'src/core/application/mapper/i-mapper.token';

// --- Domain & Factory ---
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { KahootFactory, SlideInput } from '../../../domain/factories/kahoot.factory';
import type { IKahootRepository } from '../../../domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

// --- Application Services & Ports ---
import { CreateKahootCommand } from './create-kahoot.command';
import { KahootSlideCommand } from '../base';
import { KahootHandlerResponseDto } from '../../dtos/kahoot.handler.response.dto';

//  Facade de Media y el Puerto del Mapper
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import type { IMapper } from 'src/core/application/mapper/i-mapper.interface';

@CommandHandler(CreateKahootCommand)
export class CreateKahootHandler implements ICommandHandler<CreateKahootCommand> {

  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
  
    @Inject(MAPPER_TOKEN)
    private readonly kahootMapper: IMapper<KahootSnapshot, KahootHandlerResponseDto>,

    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator<string>,

    private readonly mediaService: MediaEnrichmentService,
  ) { }

  async execute(command: CreateKahootCommand): Promise<Either<ErrorData, KahootHandlerResponseDto>> {
    const kahootId = await this.idGenerator.generateId();
    const slidesWithIds = await this.processSlidesWithIds(command.slides || []);

    const appContext = createKahootAppContext('createKahoot', kahootId, command.userId);

    return pipeAsync(
      // 1. Crear el Agregado
      KahootFactory.createFromInput({ 
        ...command, 
        id: kahootId, 
        authorId: command.userId, 
        slides: slidesWithIds, 
        createdAt: new Date().toISOString(), 
        playCount: 0 
      }),

      // 2. Manejo de Errores de Dominio
      k => k.mapLeft(err => err.setContext(appContext)),

      // 3. Persistencia (Guardar el estado original con IDs)
      k => k.tapChainAsync(kahoot => this.kahootRepository.saveKahootEither(kahoot)),

      // [PUNTO CRITICO] Inversión de pasos para enriquecimiento:
      
      // 4. Extraer Snapshot (Raw Data con IDs)
      k => k.map(kahoot => kahoot.getSnapshot()),

      // 5. Enriquecer Snapshot (Sustituir IDs por URLs y expandir Theme)
      //    Nota: Esto muta el snapshot o devuelve uno nuevo, dependiendo de tu implementación
      k => k.mapAsync(snapshot => this.mediaService.enrichKahoot(snapshot)),

      // 6. Mappear a DTO (Usando el snapshot ya enriquecido con URLs)
      k => k.map(enrichedSnapshot => this.kahootMapper.map(enrichedSnapshot))
    );
  }

  private async processSlidesWithIds(rawSlides: KahootSlideCommand[]): Promise<SlideInput[]> {
    return Promise.all(
      rawSlides.map(async (slide) => {
        const slideId = await this.idGenerator.generateId();
        return {
          id: slideId,
          position: slide.position,
          slideType: slide.slideType,
          timeLimit: slide.timeLimit,
          question: slide.question,
          slideImage: slide.slideImage, // Aquí entra el ID
          points: slide.points,
          description: slide.description,
          options: slide.options?.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            optionImage: opt.optionImage // Aquí entra el ID
          }))
        };
      })
    );
  }
}