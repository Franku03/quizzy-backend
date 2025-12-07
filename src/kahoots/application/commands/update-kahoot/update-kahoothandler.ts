// src/kahoots/application/commands/update-kahoot/update-kahoot.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { KahootFactory, SlideInput } from '../../../domain/factories/kahoot.factory';
import { UpdateKahootCommand } from './update-kahootcommand';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { UpdateKahootError } from '../../errors/kahoot-aplication.errors';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import { VisibilityStatusEnum } from '../../../domain/value-objects/kahoot.visibility-status';
import { KahootStatusEnum } from '../../../domain/value-objects/kahoot.status';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { AttemptCleanupService } from '../../services/attempt-clear.service';
import { KahootAuthorizationService } from '../../services/kahoot-athorization.service';
import type { IKahootMapper } from '../../ports/i-kahoot-mapper.port';
import { KahootMapperService } from '../../services/kahoot.mapper.service';
import { KahootErrorMapper } from '../../errors/kahoot-error.mapper';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';

@CommandHandler(UpdateKahootCommand)
export class UpdateKahootHandler
    implements ICommandHandler<UpdateKahootCommand, Either<UpdateKahootError, KahootHandlerResponse>> {

    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        @Inject(KahootMapperService)
        private readonly kahootMapper: IKahootMapper,
        private readonly attemptCleanup: AttemptCleanupService,
        private readonly authService: KahootAuthorizationService,
        @Inject(UuidGenerator)
        private readonly idGenerator: IdGenerator<string>,
    ) { }

    async execute(command: UpdateKahootCommand): Promise<Either<UpdateKahootError, KahootHandlerResponse>> {
        try {
            // 1. Obtener kahoot con validación de autorización (TODO: actualizar servicio)
            const authResult = await this.authService.getKahootForUpdate(command.id, command.userId);
            
            if (authResult.isLeft()) {
                const domainError = authResult.getLeft();
                return Either.makeLeft(
                    KahootErrorMapper.fromDomain(
                        domainError,
                        'update',
                        { kahootId: command.id, userId: command.userId }
                    ) as UpdateKahootError
                );
            }

            const currentKahoot = authResult.getRight();

            // 2. Aplicar updates (la factory maneja nulidad)
            await this.applyUpdates(currentKahoot, command);

            // 3. Guardar cambios
            const saveResult = await this.kahootRepository.saveKahootEither(currentKahoot);
            if (saveResult.isLeft()) {
                const infraError = saveResult.getLeft();
                return Either.makeLeft(
                    KahootErrorMapper.fromInfrastructure(
                        infraError,
                        'update',
                        { kahootId: command.id, userId: command.userId }
                    ) as UpdateKahootError
                );
            }

            // 4. Limpiar intentos
            await this.attemptCleanup.cleanupById(new KahootId(command.id));

            // 5. Mapear respuesta
            const snapshot = currentKahoot.getSnapshot();
            const response = await this.kahootMapper.fromSnapshot(snapshot);

            return Either.makeRight(response);

        } catch (error) {
            return Either.makeLeft(
                KahootErrorMapper.fromAny(error, 'update', {
                    kahootId: command.id,
                    userId: command.userId
                }) as UpdateKahootError
            );
        }
    }

    private async applyUpdates(kahoot: Kahoot, command: UpdateKahootCommand): Promise<void> {
        // La factory maneja nulidad, así que podemos llamar todo

        // 1. Actualizar detalles (los undefined los maneja la factory)
        const newDetailsOptional = KahootFactory.assembleKahootDetails(
            command.title,
            command.description,
            command.category,
        );

        kahoot.updateDetails(newDetailsOptional.getValue());

        // 2. Actualizar styling
        const newStyling = KahootFactory.assembleKahootStyling(
            command.themeId,
            command.imageId
        );

        kahoot.updateStyling(newStyling);

        // 3. Actualizar visibilidad
        if (command.visibility === VisibilityStatusEnum.PUBLIC) {
            kahoot.makePublic();
        } else if (command.visibility === VisibilityStatusEnum.PRIVATE) {
            kahoot.hide();
        }

        // 4. Actualizar estatus
        if (command.status === KahootStatusEnum.DRAFT) {
            kahoot.draft();
        } else if (command.status === KahootStatusEnum.PUBLISH) {
            kahoot.publish();
        }

        // 5. Reemplazar slides si vienen
        if (command.slides && command.slides.length > 0) {
            const slidesInputWithIds: SlideInput[] = await Promise.all(
                command.slides.map(async (slideCommand) => {
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

            const newSlides = new Map();
            slidesInputWithIds.forEach((input) => {
                const newSlide = KahootFactory.buildSlide(input);
                newSlides.set(newSlide.id.value, newSlide);
            });

            kahoot.replaceSlides(newSlides);
        }

    }
}