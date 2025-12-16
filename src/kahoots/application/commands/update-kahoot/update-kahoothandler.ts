// src/kahoots/application/commands/update-kahoot/update-kahoot.handler.ts
import { Inject } from '@nestjs/common';
import { UpdateKahootCommand } from './update-kahootcommand'; 
import { KahootSlideCommand } from '../base';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';

// Importaciones Universales y de Core
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/adapters/idgenerator/uuid-generator'; 

// Importaciones de Dominio y Puertos
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { KahootFactory, SlideInput } from '../../../domain/factories/kahoot.factory';
import { AttemptCleanupService } from '../../services/attempt-clear.service';
import { KahootAuthorizationService } from '../../services/kahoot-athorization.service';
import { KahootResponseService } from '../../services/kahoot-response.service';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';

@CommandHandler(UpdateKahootCommand)
export class UpdateKahootHandler
                // ICommandHandler<UpdateKahootCommand, Either<ErrorData, KahootHandlerResponse>>
    implements ICommandHandler<UpdateKahootCommand> {

    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        @Inject(KahootResponseService)
        private readonly kahootResponseService: KahootResponseService,
        private readonly attemptCleanup: AttemptCleanupService,
        private readonly authService: KahootAuthorizationService,
        @Inject(ID_GENERATOR)
        private readonly idGenerator: IdGenerator<string>,
    ) { }

    async execute(command: UpdateKahootCommand): Promise<Either<ErrorData, KahootHandlerResponse>> {
        // Contexto base para errores
        const errorContext = createDomainContext('Kahoot', 'updateKahoot', {
            domainObjectId: command.id,
            actorId: command.userId,
            userId: command.userId,
            title: command.title,
            intendedAction: 'update',
        });

        try {
            // 1. Obtener kahoot con validación de autorización
            const authResult = await this.authService.getKahootForUpdate(command.id, command.userId);

            if (authResult.isLeft()) {
                return Either.makeLeft(authResult.getLeft());
            }

            const currentKahoot = authResult.getRight();

            // 2. Aplicar updates
            await this.applyUpdates(currentKahoot, command);

            // 3. Guardar cambios
            const saveResult = await this.kahootRepository.saveKahootEither(currentKahoot);
            if (saveResult.isLeft()) {
                //this.logger.error(`Error saving updated kahoot ${command.id}.`, saveResult.getLeft());
                return Either.makeLeft(saveResult.getLeft());
            }

            // 4. Limpiar intentos
            await this.attemptCleanup.cleanupById(new KahootId(command.id));

            // 5. Obtener respuesta enriquecida usando el servicio de respuesta
            const enrichedResponse = await this.kahootResponseService.toResponse(currentKahoot);

            return Either.makeRight(enrichedResponse);

        } catch (error) {
            // Manejo de errores específicos
            if (error instanceof ErrorData) {
                //this.logger.warn(`Update failed due to Known ErrorData: ${error.code}`, error);
                return Either.makeLeft(error);
            }

            // Validaciones de dominio
            if (error instanceof Error && error.message.includes('validation')) {
                return Either.makeLeft(
                    DomainErrorFactory.validation(
                        errorContext,
                        { general: [error.message] },
                        `Validation error: ${error.message}`
                    )
                );
            }

            // Error inesperado de aplicación
            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during update: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );
            return Either.makeLeft(unexpectedError);
        }
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