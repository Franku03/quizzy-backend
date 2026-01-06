// src/kahoots/application/commands/create-kahoot/create-kahoot.handler.ts

// --- Nest & CQRS ---
import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';

// --- Core Logic & Errors ---
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { createKahootAppContext } from '../context/base-kahoot-context';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

// --- Aspects & Decorators ---
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';

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
  
    @Inject(APPLICATION_CORE_TOKENS.MAPPER.RESPONSE_MAPPER)
    private readonly kahootMapper: IMapper<KahootSnapshot, KahootHandlerResponseDto>,

    @Inject(APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR)
    private readonly idGenerator: IdGenerator<string>,

    private readonly mediaService: MediaEnrichmentService,

    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) { }

  @Log() 
  async execute(command: CreateKahootCommand): Promise<Either<ErrorData, KahootHandlerResponseDto>> {
    const kahootId = this.idGenerator.generateId();
    const slidesWithIds = this.processSlidesWithIds(command.slides || []);

    const appContext = createKahootAppContext('createKahoot', kahootId, command.userId);

    return pipeAsync<ErrorData, KahootHandlerResponseDto>(
      // 1. Crear el Agregado
      KahootFactory.createFromInput({ 
        ...command, 
        id: kahootId, 
        authorId: command.userId, 
        slides: slidesWithIds, 
        createdAt: new Date().toISOString(), 
        playCount: 0 
      })
      // 2. Manejo de Errores de Dominio (Agregar contexto adicional)
      .mapLeft(err => err.setContext(appContext)),

      // 3. Persistencia (Guardar el estado original con IDs)
      k => k.tapChainAsync(kahoot => this.kahootRepository.saveKahootEither(kahoot)),
      
      // 4. Extraer Snapshot (Raw Data con IDs)
      k => k.map(kahoot => kahoot.getSnapshot()),

      // 5. Enriquecer Snapshot (Sustituir IDs por URLs y expandir Theme)
      //    Nota: Esto muta el snapshot 
      k => k.mapAsync(snapshot => this.mediaService.enrichKahoot(snapshot)),

      // 6. Mappear a DTO (Usando el snapshot ya enriquecido con URLs)
      k => k.map(enrichedSnapshot => this.kahootMapper.map(enrichedSnapshot))
    );
  }

  // --- METODOS PRIVADOS ---

  private processSlidesWithIds(rawSlides: KahootSlideCommand[]): SlideInput[] {
    return rawSlides.map((slide) => {
      const slideId = this.idGenerator.generateId();
      return {
        id: slideId,
        position: slide.position,
        slideType: slide.slideType,
        timeLimit: slide.timeLimit,
        question: slide.question,
        slideImage: slide.slideImage,
        points: slide.points,
        description: slide.description,
        options: slide.options?.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          optionImage: opt.optionImage 
        }))
      };
    });
  }
}