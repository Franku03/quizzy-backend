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

    return pipeAsync(
      // 1. Infraestructura: Recuperación
      this.kahootRepository.findKahootByIdEither(command.id),

      // 2. Dominio: Lógica de Negocio (Igual que antes)
      k => k.chainAsync(kahoot => this.applyUpdates(kahoot, command)),

      // 3. Aplicación: Contexto de error
      k => k.mapLeft(err => err.setContext(appContext)),

      // 4. Infraestructura: Persistencia
      k => k.tapChainAsync(kahoot => this.kahootRepository.saveKahootEither(kahoot)),

      // 5. Aplicación: Side Effects
      k => k.tapChainAsync(kahoot => this.runSideEffects(kahoot)),

      // [CAMBIO DE FLUJO] Inversión para enriquecimiento:
      
      // 6. Obtener Snapshot Raw
      k => k.map(kahoot => kahoot.getSnapshot()),

      // 7. Enriquecer Snapshot (URLs & Theme)
      k => k.mapAsync(snapshot => this.mediaService.enrichKahoot(snapshot)),

      // 8. Transformar a DTO
      k => k.map(enrichedSnapshot => this.kahootMapper.map(enrichedSnapshot))
    );
  }

  // --- MÉTODOS PRIVADOS SIN CAMBIOS ---

  private async applyUpdates(kahoot: Kahoot, command: UpdateKahootCommand): Promise<Either<ErrorData, Kahoot>> {
    const detailsVO = KahootFactory.assembleDetails(command.title, command.description, command.category);

    // Procesamiento de Styling (Asíncrono)
    const stylingRes = await KahootFactory.assembleStyling(command.themeId, command.imageId);
    if (stylingRes.isLeft()) return Either.makeLeft(stylingRes.getLeft());
    kahoot.updateStyling(stylingRes.getRight());

    // Procesamiento de Slides (Asíncrono)
    const slidesRes = await this.processSlidesMap(command.slides || []);
    if (slidesRes.isLeft()) return Either.makeLeft(slidesRes.getLeft());
    kahoot.replaceSlides(slidesRes.getRight());

    // Validaciones Síncronas
    const initialSyncRes = KahootStatus.create(command.status)
      .chain(status => VisibilityStatus.create(command.visibility)
        .chain(visibility => {
          kahoot.changeStatus(status.value);
          kahoot.changeVisibility(visibility.value);

          if (detailsVO.hasValue()) {
            const updateRes = kahoot.updateDetails(detailsVO.getValue());
            if (updateRes.isLeft()) return updateRes as any;
          }

          return Either.makeRight(undefined);
        })
      );

    if (initialSyncRes.isLeft()) return Either.makeLeft(initialSyncRes.getLeft());

    return Either.makeRight(kahoot);
  }

  private async runSideEffects(kahoot: Kahoot): Promise<Either<ErrorData, Kahoot>> {
    await this.attemptCleanup.cleanupById(new KahootId(kahoot.id.value)).catch(() => null);
    return Either.makeRight(kahoot);
  }

  private async processSlidesMap(rawSlides: KahootSlideCommand[]): Promise<Either<ErrorData, Map<string, any>>> {
    const slidesInput: SlideInput[] = await Promise.all(
      rawSlides.map(async (s) => ({
        ...s,
        id: s.id || await this.idGenerator.generateId(),
        options: s.options?.map(o => ({ ...o })) || []
      }))
    );

    return KahootFactory.processSlides(slidesInput, (s: SlideInput, p: number) =>
      KahootFactory.buildSlideFromInput(s, p)
    );
  }
}