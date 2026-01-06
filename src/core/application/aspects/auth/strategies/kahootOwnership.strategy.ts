import { AppErrorFactory } from "src/core/errors/factories/app-error.factory";
import { createApplicationContext } from "src/core/errors/helpers/app-error-context.helper";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { IKahootDao } from "src/kahoots/application/ports/i-kahoot.dao.interface";
import { IAuthorizer } from "../authorizer.interface";
import { VisibilityStatusEnum } from "src/kahoots/domain/value-objects/kahoot.visibility-status";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";

// REGLA: Interfaz para normalizar el acceso a datos sin importar si es Agregado o Snapshot.
interface IKahootAuthData {
    authorId: string;
    visibility: string;
    status: string;
}

// REGLA: Definición de tipos para soportar búsqueda tanto en DAO (lectura) como en Repositorio (dominio).
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
        
        // REGLA: Normalización del ID y creación de metadatos de error.
        const finalId = (request.kahootId || request.id) as string;
        const { userId, operationName } = request;

        const appContext = createApplicationContext(operationName, { 
            actorId: userId, 
            resourceTargetId: finalId,
            resourceType: 'Kahoot'
        });

        // REGLA: Selección del método de obtención según lo que haya inyectado el Handler.
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
            // REGLA: Si el fetcher no encuentra nada, error 404 vía Factory.
            if (!resource) return Either.makeLeft(AppErrorFactory.notFound(appContext));

            // REGLA: Duck Typing para extraer datos de validación.
            const data = resource as unknown as IKahootAuthData;
            
            const authorId = data.authorId;
            const visibility = (data.visibility || '').toUpperCase();
            const status = (data.status || '').toUpperCase();

            const isOwner = authorId === userId;
            const isReadOperation = /^(get|read|find|list)/i.test(operationName);
            const isPublic = visibility === VisibilityStatusEnum.PUBLIC;

            // REGLA: Si es DRAFT, se prohíbe el acceso a cualquier actor que no sea el autor (Forbidden).
            if (status === 'DRAFT' && !isOwner) {
                return Either.makeLeft(AppErrorFactory.forbidden(appContext, "Cannot access a draft Kahoot"));
            }

            // REGLA: Lógica de acceso general. Lectura (Público o Dueño) | Escritura (Solo Dueño).
            const hasAccess = isReadOperation ? (isPublic || isOwner) : isOwner;

            if (hasAccess) {
                return Either.makeRight(resource);
            }

            // REGLA: Si no cumple las condiciones de identidad, error 401 vía Factory.
            return Either.makeLeft(AppErrorFactory.unauthorized(appContext));
        });
    }
}