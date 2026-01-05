import { AppErrorFactory } from "src/core/errors/factories/app-error.factory";
import { createApplicationContext } from "src/core/errors/helpers/app-error-context.helper";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { IKahootDao } from "src/kahoots/application/ports/i-kahoot.dao.interface";
import { IAuthorizer } from "../authorizer.interface";
import { VisibilityStatusEnum } from "src/kahoots/domain/value-objects/kahoot.visibility-status";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";

type KahootFetcher = 
    Partial<Pick<IKahootDao, 'getKahootById'>> & 
    Partial<Pick<IKahootRepository, 'findKahootByIdEither'>>;

type ExclusiveId = 
    | { kahootId: string; id?: never } 
    | { id: string; kahootId?: never };

export type IKahootOwnershipRequest = ExclusiveId & {
    userId: string;
    operationName: string; 
    validatedResource?: KahootSnapshot | Kahoot;
};

export class KahootOwnershipAuthorizer implements IAuthorizer<IKahootOwnershipRequest, KahootFetcher, KahootSnapshot | Kahoot> {

    async authorize(
        request: IKahootOwnershipRequest,
        context: KahootFetcher 
    ): Promise<Either<ErrorData, KahootSnapshot | Kahoot>> {
        
        const finalId = (request.kahootId || request.id) as string;
        const { userId, operationName } = request;

        const appContext = createApplicationContext(operationName, { 
            actorId: userId, 
            resourceTargetId: finalId,
            resourceType: 'Kahoot'
        });

        const fetchMethod = context.getKahootById?.bind(context) 
                         || context.findKahootByIdEither?.bind(context);

        if (!fetchMethod) {
            return Either.makeLeft(new ErrorData(
                'AUTH_CONTEXT_INVALID',
                `Context missing search methods`,
                ErrorLayer.APPLICATION,
                appContext
            ));
        }

        const result = await fetchMethod(finalId);

        return result.chain(resource => {
            if (!resource) return Either.makeLeft(AppErrorFactory.notFound(appContext));

            // Normalización de datos (Soportando Agregado o Snapshot)
            const authorId = resource instanceof Kahoot ? resource.authorId : resource.authorId;
            const visibility = resource instanceof Kahoot ? resource.visibility : resource.visibility;

            const isOwner = authorId === userId;
            
            // Mejoramos el Match: Buscamos palabras que EMPIECEN con Get, Read o Find
            // Esto evita falsos positivos en medio de otras palabras.
            const isReadOperation = /^(get|read|find|list)/i.test(operationName);
            
            const isPublic = visibility.toUpperCase() === VisibilityStatusEnum.PUBLIC;

            // REGLA: 
            // Si es lectura: Pasa si es Público O si soy el dueño.
            // Si es escritura: SOLO pasa si soy el dueño.
            const hasAccess = isReadOperation ? (isPublic || isOwner) : isOwner;

            if (hasAccess) {
                return Either.makeRight(resource);
            }

            return Either.makeLeft(AppErrorFactory.unauthorized(appContext));
        });
    }
}