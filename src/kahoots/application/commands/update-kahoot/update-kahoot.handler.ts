// src/kahoots/application/commands/update-kahoot/update-kahoot.handler.ts

// --- Externals & Core ---
import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { MAPPER_TOKEN } from 'src/core/application/mapper/i-mapper.token';

// --- Domain Models & VOs ---
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { KahootStatus } from 'src/kahoots/domain/value-objects/kahoot.status';
import { VisibilityStatus } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';
import { KahootFactory, SlideInput } from 'src/kahoots/domain/factories/kahoot.factory';

// --- Domain Ports & Repositories ---
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

// --- Application Commands & Context ---
import { UpdateKahootCommand } from './update-kahoot.command';
import { KahootSlideCommand } from '../base';
import { createKahootAppContext } from '../context/base-kahoot-context';

// --- Application Services & Response ---
import { AttemptCleanupService } from '../../services/attempt-clear.service';
import { KahootHandlerResponseDto } from '../../dtos/kahoot.handler.response.dto';

//  Import el Facade de Media y el Puerto del Mapper
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import type { IMapper } from 'src/core/application/mapper/i-mapper.interface';



@CommandHandler(UpdateKahootCommand)
export class UpdateKahootHandler implements ICommandHandler<UpdateKahootCommand> {

  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    
    @Inject(MAPPER_TOKEN)
    private readonly kahootMapper: IMapper<KahootSnapshot, KahootHandlerResponseDto>,

    private readonly mediaService: MediaEnrichmentService,

    private readonly attemptCleanup: AttemptCleanupService,
    
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator<string>,
  ) { }

  async execute(command: UpdateKahootCommand): Promise<Either<ErrorData, KahootHandlerResponseDto>> {
    const appContext = createKahootAppContext('updateKahoot', command.id, command.userId);

    return pipeAsync<ErrorData, KahootHandlerResponseDto>(
      // 1. Infraestructura: Recuperación
      this.kahootRepository.findKahootByIdEither(command.id),

      // 2. Dominio: Lógica de Negocio (Igual que antes) 
      k => k.chain(kahoot => this.applyUpdates(kahoot, command)
      
      //3. Manejo de Errores de Dominio (Agregar contexto adicional)
      .mapLeft(err => err.setContext(appContext))),

      // 4. Infraestructura: Persistencia
      k => k.tapChainAsync(kahoot => this.kahootRepository.saveKahootEither(kahoot)),

      // 5. Aplicación: Side Effects
      k => k.tapChainAsync(kahoot => this.runSideEffects(kahoot)),

      // 6. Obtener Snapshot Raw
      k => k.map(kahoot => kahoot.getSnapshot()),

      // 7. Enriquecer Snapshot (URLs & Theme)
      k => k.mapAsync(snapshot => this.mediaService.enrichKahoot(snapshot)),

      // 8. Transformar a DTO
      k => k.map(enrichedSnapshot => this.kahootMapper.map(enrichedSnapshot))
    );
  }

  // --- MÉTODOS PRIVADOS  ---

  private applyUpdates(kahoot: Kahoot, command: UpdateKahootCommand): Either<ErrorData, Kahoot> {
    // Todo el flujo es una sola cadena de .chain()
    return this.processSlidesMap(command.slides || [])
      .chain(slidesMap => KahootStatus.create(command.status)
        .chain(status => VisibilityStatus.create(command.visibility)
          .chain(visibility => KahootFactory.assembleStyling(command.themeId, command.imageId)
            .chain(styling => {
              
              // 1. Aplicamos cambios al agregado
              kahoot.replaceSlides(slidesMap);
              kahoot.updateStyling(styling);
              kahoot.changeStatus(status.value);
              kahoot.changeVisibility(visibility.value);

              // 2. Aplicamos detalles (OptionalVO)
              const detailsVO = KahootFactory.assembleDetails(command.title, command.description, command.category);
              if (detailsVO.hasValue()) {
                const detailsRes = kahoot.updateDetails(detailsVO.getValue());
                if (detailsRes.isLeft()) return detailsRes as any;
              }

              return Either.makeRight(kahoot);
            })
          )
        )
      );
  }

  private async runSideEffects(kahoot: Kahoot): Promise<Either<ErrorData, Kahoot>> {
    await this.attemptCleanup.cleanupById(new KahootId(kahoot.id.value)).catch(() => null);
    return Either.makeRight(kahoot);
  }

  private processSlidesMap(rawSlides: KahootSlideCommand[]): Either<ErrorData, Map<string, any>> {
    // Generación de IDs síncrona
    const slidesInput: SlideInput[] = rawSlides.map((s) => ({
      ...s,
      id: s.id || this.idGenerator.generateId(),
      options: s.options?.map(o => ({ ...o })) || []
    }));

    return KahootFactory.processSlides(slidesInput, (s: SlideInput, p: number) =>
      KahootFactory.buildSlideFromInput(s, p)
    );
  }
}