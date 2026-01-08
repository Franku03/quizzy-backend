import { AppErrorFactory } from "src/core/errors/factories/app-error.factory";
import { createApplicationContext } from "src/core/errors/helpers/app-error-context.helper";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { IKahootDao } from "src/kahoots/application/ports/i-kahoot.dao.interface";
import { IAuthorizer } from "../authorizer.interface";
import { VisibilityStatusEnum } from "src/kahoots/domain/value-objects/kahoot.visibility-status";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { KahootStatusEnum } from "src/kahoots/domain/value-objects/kahoot.status";

type KahootFetcher =
    | Partial<Pick<IKahootDao, 'getKahootById'>>
    & Partial<Pick<IKahootRepository, 'findKahootByIdEither'>>;

type ExclusiveId =
    | { kahootId: string; id?: never }
    | { id: string; kahootId?: never };

export type IKahootOwnershipRequest = ExclusiveId & {
    userId: string;
    operationName: string;
    validatedResource?: KahootSnapshot | Kahoot;
};

// RULE [TÉCNICA]: Estructura que unifica Value Objects y Primitivos.
// Usamos interfaces que TypeScript puede navegar sin 'typeof'.
interface ValueObject { value: string }

type RawOrVO = string | ValueObject;

interface Authorizable {
    authorId?: string
    author?: RawOrVO;
    visibility?: RawOrVO;
    status?: RawOrVO;
    properties?: Authorizable;
}

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
                'AUTH_CONTEXT_INVALID', 'Context missing search methods',
                ErrorLayer.APPLICATION, appContext
            ));
        }

        const result = await fetchMethod(finalId);

        return result.chain(resource => {
            if (!resource) return Either.makeLeft(AppErrorFactory.notFound(appContext));

            // REGLA [TÉCNICA]: Acceso estructural directo al recurso (Agregado o Snapshot)
            const raw = resource as Authorizable;
            const data = raw.properties || raw;

            // REGLA [TÉCNICA]: Normalización mediante encadenamiento opcional.
            // Se extrae el ID del autor priorizando la estructura de Objeto de Valor (VO).
            const authorId = (data.author as ValueObject)?.value ?? (data.author as string) ?? data.authorId ?? '';

            const visibilityStr = (data.visibility as ValueObject)?.value ?? (data.visibility as string) ?? '';
            const visibility = visibilityStr.toUpperCase();

            const statusStr = (data.status as ValueObject)?.value ?? (data.status as string) ?? '';
            const status = statusStr.toUpperCase();

            const isOwner = authorId === userId;
            const isPublic = visibility === VisibilityStatusEnum.PUBLIC;

            // REGLA [NEGOCIO]: Clasificación de la naturaleza de la operación
            const isReadOperation = /^(get|read|find|list)/i.test(operationName);
            const isExecutionOperation = /^(create|start|launch)session/i.test(operationName);

            // REGLA [NEGOCIO]: Restricción de Borrador (Draft)
            if (status === KahootStatusEnum.DRAFT) {
                // No se puede jugar/lanzar un Kahoot que no esté publicado
                if (isExecutionOperation) {
                    return Either.makeLeft(AppErrorFactory.forbidden(appContext, "Cannot launch a session from a draft Kahoot."));
                }
                // Los borradores no son visibles para nadie más que el dueño
                if (!isOwner) {
                    return Either.makeLeft(AppErrorFactory.forbidden(appContext, "Cannot access a draft Kahoot"));
                }
            }

            // REGLA [NEGOCIO]: Verificación final de acceso (Lectura vs Escritura)
            const hasAccess = isReadOperation ? (isPublic || isOwner) : isOwner;

            return hasAccess
                ? Either.makeRight(resource)
                : Either.makeLeft(AppErrorFactory.forbidden(appContext, "Access denied"));
        });
    }
}