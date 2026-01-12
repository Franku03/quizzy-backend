/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\update-kahoot\update-kahoot.handler.ts

// --- Nest & CQRS ---
import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import type { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { createKahootAppContext } from '../context/base-kahoot-context';

// --- Aspects & Decorators ---
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { KahootOwnershipAuthorizer, IKahootOwnershipRequest } from 'src/core/application/aspects/auth/strategies/kahootOwnership.strategy';

// --- Domain Models & VOs ---
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { KahootStatus } from 'src/kahoots/domain/value-objects/kahoot.status';
import { VisibilityStatus } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';
import { KahootFactory, SlideInput } from 'src/kahoots/domain/factories/kahoot.factory';
import { Slide } from 'src/kahoots/domain/entities/slides/kahoot.slide';

// --- Domain Ports & Repositories ---
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

// --- Application Commands & Context ---
import { UpdateKahootCommand } from './update-kahoot.command';
import { KahootSlideCommand } from '../base';

// --- Application Services & Response ---
import { AttemptCleanupService } from '../../services/attempt-clear.service';
import { KahootHandlerResponseDto } from '../../dtos/kahoot.handler.response.dto';

//  Import el Facade de Media y el Puerto del Mapper
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import type { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';




@CommandHandler(UpdateKahootCommand)
export class UpdateKahootHandler implements ICommandHandler<UpdateKahootCommand> {

  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    @Inject(APPLICATION_CORE_TOKENS.MAPPER.RESPONSE_MAPPER)
    private readonly kahootMapper: IMapper<KahootSnapshot, KahootHandlerResponseDto>,
    private readonly mediaService: MediaEnrichmentService,
    private readonly attemptCleanup: AttemptCleanupService,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR)
    private readonly idGenerator: IdGenerator<string>,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) { }

  @Log()
  @Authorize(KahootOwnershipAuthorizer, 'kahootRepository')
  async execute(
    command: UpdateKahootCommand & IKahootOwnershipRequest
  ): Promise<Either<ErrorData, KahootHandlerResponseDto>> {

    const appContext = createKahootAppContext('updateKahoot', command.kahootId, command.userId);

    return pipeAsync<ErrorData, KahootHandlerResponseDto>(
      // 1. RECURSO YA VALIDADO: Iniciamos el tren directamente con el Agregado inyectado
      Either.makeRight(command.validatedResource as Kahoot),

      // 2. Lógica de Dominio (Mutación controlada por performance)
      k => k.chain(kahoot => this.applyUpdates(kahoot, command))
      //Agregando contexto de app extra a los posibles errores de dominio
      .mapLeft(err => err.setContext(appContext)),

      // 3. Persistencia
      k => k.tapChainAsync(kahoot => this.kahootRepository.saveKahootEither(kahoot)),

      // 4. Efectos secundarios (Cleanup)
      k => k.tapChainAsync(kahoot => this.runSideEffects(kahoot)),

      // 5. Transformación Final (Snapshot -> Enriquecer -> DTO)
      k => k.map(kahoot => kahoot.getSnapshot()),
      k => k.mapAsync(snapshot => this.mediaService.enrichKahoot(snapshot)),
      k => k.map(enriched => this.kahootMapper.map(enriched))
    );
  }

  private applyUpdates(kahoot: Kahoot, command: UpdateKahootCommand): Either<ErrorData, Kahoot> {
    // Railway puro: si uno falla, el resto no se ejecuta.
    return this.processSlidesMap(command.slides || [])
      .chain(slidesMap => kahoot.replaceSlides(slidesMap))
      .chain(() => KahootFactory.assembleStyling(command.themeId, command.imageId))
      .chain(styling => kahoot.updateStyling(styling))
      .chain(() => VisibilityStatus.create(command.visibility))
      .chain(visibility => {
        kahoot.changeVisibility(visibility.value);
        return KahootFactory.assembleDetails(command.title, command.description, command.category);
      })
      .chain(details => kahoot.updateDetails(details))
      .chain(() => KahootStatus.create(command.status))
      .chain(status => kahoot.changeStatus(status.value))
      .map(() => kahoot);
  }

  private processSlidesMap(rawSlides: KahootSlideCommand[]): Either<ErrorData, Map<string, Slide>> {
    const slidesInput: SlideInput[] = rawSlides.map((s) => ({
      ...s,
      id: s.id || this.idGenerator.generateId(),
      options: s.options?.map(o => ({ ...o })) || []
    }));

    // El Factory construye objetos 'Slide', por eso el Map es de <string, Slide>
    return KahootFactory.processSlides(slidesInput, (s: SlideInput, p: number) =>
      KahootFactory.buildSlideFromInput(s, p)
    );
  }

  private async runSideEffects(kahoot: Kahoot): Promise<Either<ErrorData, Kahoot>> {
    this.attemptCleanup.cleanupById(new KahootId(kahoot.id.value))
      .catch(err => this.logger.error(`Error cleaning up attempts for ${kahoot.id.value}`, err));
    return Either.makeRight(kahoot);
  }
}