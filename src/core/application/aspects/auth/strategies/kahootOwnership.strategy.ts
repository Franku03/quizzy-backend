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
import { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
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

// Este tipo ya define que los métodos son opcionales, por eso no necesitas 'any'
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
        context: KahootFetcher,
    ): Promise<Either<ErrorData, unknown>> {

        const finalId = (request.kahootId || request.id)!;
        const { userId, operationName, validatedResource } = request;

        const appContext = createApplicationContext(operationName, {
            actorId: userId,
            resourceTargetId: finalId,
            resourceType: 'Kahoot'
        });

        if (validatedResource) {
            return this.validateAccess(validatedResource, userId, operationName, appContext);
        }

        // --- SELECCIÓN DEL MÉTODO (TYPE-SAFE) ---
        let fetchMethod;

        // 1. Prioridad Máxima: Repositorio de Dominio (Commands)
        // TypeScript sabe que 'findKahootByIdEither' es una propiedad opcional de 'context'.
        // Al ponerlo en el if, TypeScript confirma que existe dentro del bloque.
        if (context.findKahootByIdEither) {
            fetchMethod = context.findKahootByIdEither.bind(context);
        } 
        // 2. Lógica para DAOs (Queries)
        else {
            const preferDetail = operationName.includes('UserDetail');

            // Si la operación pide detalle explícitamente y el método existe:
            if (preferDetail && context.getKahootUserDetail) {
                fetchMethod = context.getKahootUserDetail.bind(context);
            } 
            // Si no pide detalle (o no lo tiene), usamos el getById normal:
            else if (context.getKahootById) {
                fetchMethod = context.getKahootById.bind(context);
            }
        }
        // ----------------------------------------

        if (!fetchMethod) {
            return Either.makeLeft(new ErrorData('AUTH_CONTEXT_INVALID', 'No search method found in context', ErrorLayer.APPLICATION, appContext));
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
        // ... (Tu código de validación se mantiene idéntico) ...
        if (!resource) return Either.makeLeft(AppErrorFactory.notFound(appContext));

        const raw = resource as unknown as Authorizable;
        const data = raw.properties || raw;

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

        if (isDraft && isSessionOp) {
            return Either.makeLeft(AppErrorFactory.forbidden(appContext, "Cannot launch session from draft."));
        }

        if (isOwner) return Either.makeRight(resource);

        const hasAccess = isPublished && isPublic && (isReadOp || isSessionOp);

        return hasAccess
            ? Either.makeRight(resource)
            : Either.makeLeft(AppErrorFactory.forbidden(appContext, "Access denied."));
    }
}