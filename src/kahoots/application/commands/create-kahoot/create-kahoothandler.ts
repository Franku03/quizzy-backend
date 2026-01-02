// --- Nest & CQRS ---
import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';

// --- Core Logic & Errors ---
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { createKahootAppContext } from '../base/base-kahoot-context';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';

// --- Domain & Factory ---
import { KahootFactory, SlideInput } from '../../../domain/factories/kahoot.factory';
import type { IKahootRepository } from '../../../domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

// --- Application Services & Ports ---
import { CreateKahootCommand } from './create-kahootcommand';
import { KahootSlideCommand } from '../base';
import { KahootResponseService } from '../../services/kahoot-response.service';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import { KAHOOT_MEDIA_ENRICHER } from '../../dependency-tokkens/application-kahoot.tokens';
import type { IMediaEnricher } from '../../ports/i-media-enricher.interface';

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
    const slidesWithIds = await this.processSlidesWithIds(command.slides || []);

    const appContext = createKahootAppContext('createKahoot', kahootId, command.userId);

    return pipeAsync(
      KahootFactory.createFromInput({ 
        ...command, 
        id: kahootId, 
        authorId: command.userId, 
        slides: slidesWithIds, 
        createdAt: new Date().toISOString(), 
        playCount: 0 
      }),

      k => k.mapLeft(err => err.setContext(appContext)),

      k => k.tapChainAsync(kahoot => this.kahootRepository.saveKahootEither(kahoot)),

      k => k.map(kahoot => this.kahootResponseService.toResponse(kahoot)),

      k => k.mapAsync(dto => this.mediaEnricher.enrich(dto))
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
          slideImage: slide.slideImage,
          points: slide.points,
          description: slide.description,
          options: slide.options?.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            optionImage: opt.optionImage
          }))
        };
      })
    );
  }
}