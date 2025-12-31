// src/kahoots/application/commands/update-kahoot/update-kahoot.handler.ts

import { Inject } from '@nestjs/common';
import { UpdateKahootCommand } from './update-kahootcommand'; 
import { KahootSlideCommand } from '../base';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';

// Core, Types y Puertos Universales
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';

// Dominio y Persistencia
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { KahootFactory, SlideInput } from '../../../domain/factories/kahoot.factory';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';

// Response y Media (LA CLAVE)
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import type { IMediaEnricher } from '../../ports/i-media-enricher.interface';
import { KAHOOT_MEDIA_ENRICHER } from '../../dependency-tokkens/application-kahoot.tokens'; // Tu nuevo Token de Symbol

// Servicios de Aplicación
import { AttemptCleanupService } from '../../services/attempt-clear.service';
import { KahootAuthorizationService } from '../../services/kahoot-athorization.service';
import { KahootResponseService } from '../../services/kahoot-response.service';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

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
        private readonly authService: KahootAuthorizationService,
        @Inject(ID_GENERATOR)
        private readonly idGenerator: IdGenerator<string>,
    ) { }

    async execute(command: UpdateKahootCommand): Promise<Either<ErrorData, KahootHandlerResponse>> {
        const errorContext = createDomainContext('Kahoot', 'updateKahoot', {
            domainObjectId: command.id,
            actorId: command.userId,
            intendedAction: 'update',
        });

        try {
            // 1. Autorización y Obtención (DIP mediante authService)
            const authResult = await this.authService.getKahootForUpdate(command.id, command.userId);
            if (authResult.isLeft()) return Either.makeLeft(authResult.getLeft());

            const currentKahoot = authResult.getRight();

            // 2. Aplicar updates al Agregado
            await this.applyUpdates(currentKahoot, command);

            // 3. Persistencia
            const saveResult = await this.kahootRepository.saveKahootEither(currentKahoot);
            if (saveResult.isLeft()) return Either.makeLeft(saveResult.getLeft());

            // 4. Lógica colateral (Cleanup)
            await this.attemptCleanup.cleanupById(new KahootId(command.id));

            // 5. MAPEO: De Agregado a Response Plano (Solo IDs)
            // KahootResponseService ya no llama internamente al enricher
            const plainResponse = await this.kahootResponseService.toResponse(currentKahoot);

            // 6. ENRIQUECIMIENTO: Transformar IDs en URLs reales 🎯
            const enrichedResponse = await this.mediaEnricher.enrich(plainResponse);

            return Either.makeRight(enrichedResponse);

        } catch (error) {
            return Either.makeLeft(this.handleError(error, errorContext));
        }
    }

    private handleError(error: any, context: any): ErrorData {
        if (error instanceof ErrorData) return error;

        if (error instanceof Error && error.message.includes('validation')) {
            return DomainErrorFactory.validation(
                context,
                { general: [error.message] },
                `Validation error: ${error.message}`
            );
        }

        return new ErrorData(
            "APPLICATION_UNEXPECTED_ERROR",
            `Unexpected error during update: ${error instanceof Error ? error.message : String(error)}`,
            ErrorLayer.APPLICATION,
            context,
            error as Error
        );
    }

    private async applyUpdates(kahoot: Kahoot, command: UpdateKahootCommand): Promise<void> {
        // 1. Actualizar detalles
        const newDetailsOptional = KahootFactory.assembleKahootDetails(
            command.title,
            command.description,
            command.category,
        );

        if (newDetailsOptional.hasValue()) {
            kahoot.updateDetails(newDetailsOptional.getValue());
        }

        // 2. Actualizar styling
        const newStyling = KahootFactory.assembleKahootStyling(
            command.themeId,
            command.imageId
        );

        kahoot.updateStyling(newStyling);

        // 3. Actualizar visibilidad
        kahoot.changeVisibility(command.visibility);

        // 4. Actualizar estatus
        kahoot.changeStatus(command.status);

        // 5. Reemplazar slides si vienen
        if (command.slides && command.slides.length > 0) {
            const newSlidesMap = await this.processSlidesForUpdate(command.slides);
            kahoot.replaceSlides(newSlidesMap);
        } else {
            //Poner mas bonito
           kahoot.replaceSlides(new Map<string, any>()); 
        }
    }

    private async processSlidesForUpdate(
        slidesCommands: KahootSlideCommand[]
    ): Promise<Map<string, any>> {
        const slidesInputWithIds: SlideInput[] = await Promise.all(
            slidesCommands.map(async (slideCommand) => {
                const slideId = slideCommand.id || await this.idGenerator.generateId();
                const options = slideCommand.options || [];

                const processedOptions = await Promise.all(
                    options.map(async (option) => ({
                        ...option,
                        id: (option as any).id || await this.idGenerator.generateId(),
                    }))
                );

                return {
                    ...slideCommand,
                    id: slideId,
                    answers: processedOptions,
                } as SlideInput;
            })
        );

        const newSlides = new Map<string, any>();
        slidesInputWithIds.forEach((input) => {
            const newSlide = KahootFactory.buildSlide(input);
            newSlides.set(newSlide.id.value, newSlide);
        });

        return newSlides;
    }
}