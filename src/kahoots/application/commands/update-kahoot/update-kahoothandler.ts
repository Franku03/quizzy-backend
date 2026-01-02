// --- Externals & Core ---
import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';

// --- Domain Models & VOs ---
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { KahootStatus } from 'src/kahoots/domain/value-objects/kahoot.status';
import { VisibilityStatus } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';
import { KahootFactory, SlideInput } from 'src/kahoots/domain/factories/kahoot.factory';

// --- Domain Ports & Repositories ---
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

// --- Application Commands & Context ---
import { UpdateKahootCommand } from './update-kahootcommand';
import { KahootSlideCommand } from '../base';
import { createKahootAppContext } from '../base/base-kahoot-context';

// --- Application Services & Response ---
import { KahootResponseService } from '../../services/kahoot-response.service';
import { AttemptCleanupService } from '../../services/attempt-clear.service';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';

// --- Application Ports & Tokens ---
import { KAHOOT_MEDIA_ENRICHER } from '../../dependency-tokkens/application-kahoot.tokens';
import type { IMediaEnricher } from '../../ports/i-media-enricher.interface';

@CommandHandler(UpdateKahootCommand)
export class UpdateKahootHandler implements ICommandHandler<UpdateKahootCommand> {

  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    @Inject(KahootResponseService)
    private readonly kahootResponseService: KahootResponseService,
    @Inject(KAHOOT_MEDIA_ENRICHER)
    private readonly mediaEnricher: IMediaEnricher<KahootHandlerResponse>,
    private readonly attemptCleanup: AttemptCleanupService,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator<string>,
  ) { }

  async execute(command: UpdateKahootCommand): Promise<Either<ErrorData, KahootHandlerResponse>> {
    const appContext = createKahootAppContext('updateKahoot', command.id, command.userId);

    return pipeAsync(
      // 1. Infraestructura: Recuperación
      this.kahootRepository.findKahootByIdEither(command.id),

      // 2. Dominio: Lógica de Negocio
      k => k.chainAsync(kahoot => this.applyUpdates(kahoot, command)),

      // 3. Aplicación: Contexto de error (Captura errores de Repo y de applyUpdates)
      k => k.mapLeft(err => err.setContext(appContext)),

      // 4. Infraestructura: Persistencia
      k => k.tapChainAsync(kahoot => this.kahootRepository.saveKahootEither(kahoot)),

      // 5. Aplicación: Side Effects
      k => k.tapChainAsync(kahoot => this.runSideEffects(kahoot)),

      // 6. Aplicación: Transformación a DTO
      k => k.map(kahoot => this.kahootResponseService.toResponse(kahoot)),

      // 7. Post-proceso: Hidratación de URLs
      k => k.mapAsync(dto => this.mediaEnricher.enrich(dto))
    );
  }

  private async applyUpdates(kahoot: Kahoot, command: UpdateKahootCommand): Promise<Either<ErrorData, Kahoot>> {
    const detailsVO = KahootFactory.assembleDetails(command.title, command.description, command.category);

    // Validaciones Síncronas iniciales (Status, Visibility, Details)
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

    // Procesamiento de Styling (Asíncrono)
    const stylingRes = await KahootFactory.assembleStyling(command.themeId, command.imageId);
    if (stylingRes.isLeft()) return Either.makeLeft(stylingRes.getLeft());
    kahoot.updateStyling(stylingRes.getRight());

    // Procesamiento de Slides (Asíncrono)
    const slidesRes = await this.processSlidesMap(command.slides || []);
    if (slidesRes.isLeft()) return Either.makeLeft(slidesRes.getLeft());
    kahoot.replaceSlides(slidesRes.getRight());

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