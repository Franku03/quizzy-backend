/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\aspects\auth\strategies\kahootOwnership.strategy.ts

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

interface ValueObject { value: string }
type RawOrVO = string | ValueObject;

interface Authorizable {
    authorId?: string;
    author?: RawOrVO | { id: string }; 
    visibility?: RawOrVO;
    status?: RawOrVO;
    properties?: Authorizable; 
}

type KahootFetcher = 
    | Partial<Pick<IKahootDao, 'getKahootById' | 'getKahootUserDetail'>>
    & Partial<Pick<IKahootRepository, 'findKahootByIdEither'>>;

export type IKahootOwnershipRequest = {
    kahootId?: string;
    id?: string;
    userId: string;
    operationName: string;
    validatedResource?: unknown; 
};

export class KahootOwnershipAuthorizer implements IAuthorizer<IKahootOwnershipRequest, KahootFetcher, unknown> {

    async authorize(
        request: IKahootOwnershipRequest,
        context: KahootFetcher
    ): Promise<Either<ErrorData, unknown>> {

        const finalId = (request.kahootId || request.id)!;
        const { userId, operationName, validatedResource } = request;

        const appContext = createApplicationContext(operationName, {
            actorId: userId,
            resourceTargetId: finalId,
            resourceType: 'Kahoot'
        });

        // REGLA: Si el recurso ya viene validado, evitamos el fetch (Optimización)
        if (validatedResource) {
            return this.validateAccess(validatedResource, userId, operationName, appContext);
        }

        const fetchMethod = (context as any).getKahootUserDetail?.bind(context)
            || context.getKahootById?.bind(context)
            || context.findKahootByIdEither?.bind(context);

        if (!fetchMethod) {
            return Either.makeLeft(new ErrorData('AUTH_CONTEXT_INVALID', 'No search method', ErrorLayer.APPLICATION, appContext));
        }

        const result = await fetchMethod(finalId, userId);
        return result.chain(resource => this.validateAccess(resource, userId, operationName, appContext));
    }

    private validateAccess(
        resource: unknown, 
        userId: string, 
        operationName: string, 
        appContext: any
    ): Either<ErrorData, unknown> {
        if (!resource) return Either.makeLeft(AppErrorFactory.notFound(appContext));

        const raw = resource as unknown as Authorizable;
        const data = raw.properties || raw;

        // Normalización estructural (Soporta Snapshot, Agregado y ReadModel)
        const authorId = (data.author as { id: string })?.id 
            ?? (data.author as ValueObject)?.value 
            ?? (data.author as string) 
            ?? data.authorId 
            ?? '';

        const visibility = ((data.visibility as ValueObject)?.value ?? (data.visibility as string) ?? '').toUpperCase();
        const status = ((data.status as ValueObject)?.value ?? (data.status as string) ?? '').toUpperCase();

        const isOwner = authorId === userId;
        const isPublic = visibility === VisibilityStatusEnum.PUBLIC.toUpperCase();
        const isPublished = status === KahootStatusEnum.PUBLISH.toUpperCase();
        const isDraft = status === KahootStatusEnum.DRAFT.toUpperCase();

        const isReadOp = /^(get|read|find|list)/i.test(operationName);
        const isSessionOp = /session/i.test(operationName);

        // Regla Estricta: Nadie juega borradores
        if (isDraft && isSessionOp) {
            return Either.makeLeft(AppErrorFactory.forbidden(appContext, "Cannot launch session from draft."));
        }

        // El Owner tiene acceso (salvo sesión en Draft)
        if (isOwner) return Either.makeRight(resource);

        // Acceso para terceros (Público + Publicado)
        const hasAccess = isPublished && isPublic && (isReadOp || isSessionOp);

        return hasAccess
            ? Either.makeRight(resource)
            : Either.makeLeft(AppErrorFactory.forbidden(appContext, "Access denied."));
    }
}