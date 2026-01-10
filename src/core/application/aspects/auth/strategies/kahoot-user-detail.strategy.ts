/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\aspects\auth\strategies\kahoot-user-detail.strategy.ts

/*import { AppErrorFactory } from "src/core/errors/factories/app-error.factory";
import { createApplicationContext } from "src/core/errors/helpers/app-error-context.helper";
import { Either, ErrorData } from "src/core/types";

// --- DTOs & Ports ---
import { KahootUserDetailReadModel } from "src/kahoots/application/dtos/kahoot-user-detail.read.model.dto";
import { IKahootDao } from "src/kahoots/application/ports/i-kahoot.dao.interface";

// --- Domain Enums ---
import { VisibilityStatusEnum } from "src/kahoots/domain/value-objects/kahoot.visibility-status";
import { KahootStatusEnum } from "src/kahoots/domain/value-objects/kahoot.status";

// --- Interfaces ---
import { IAuthorizer } from "../authorizer.interface";

export interface IKahootUserDetailRequest {
  kahootId: string;
  userId: string;
  operationName: string;
}


export class KahootUserDetailAuthorizer implements IAuthorizer<IKahootUserDetailRequest, IKahootDao, KahootUserDetailReadModel> {

  async authorize(
    request: IKahootUserDetailRequest,
    dao: IKahootDao
  ): Promise<Either<ErrorData, KahootUserDetailReadModel>> {

    // CORRECCIÓN: Usamos directamente el kahootId del request.
    const { kahootId, userId, operationName } = request;

    const appContext = createApplicationContext(operationName, {
      actorId: userId,
      resourceTargetId: kahootId, // El ID real del recurso es el Kahoot
      resourceType: 'Kahoot'
    });

    // 1. Orquestación Atómica: El DAO ya hace el trabajo pesado de unir las 3 colecciones
    const result = await dao.getKahootUserDetail(kahootId, userId);

    return result.chain(readModel => {
      // REGLA: Existencia
      if (!readModel) return Either.makeLeft(AppErrorFactory.notFound(appContext));

      // Normalización para comparaciones seguras
      const isOwner = readModel.author.id === userId;
      const visibility = readModel.visibility.toUpperCase();
      const status = readModel.status.toUpperCase();

      // REGLA [NEGOCIO]: Restricción de Borradores (Draft)
      if (status === KahootStatusEnum.DRAFT.toUpperCase() && !isOwner) {
        return Either.makeLeft(AppErrorFactory.forbidden(appContext, "Cannot access a draft Kahoot."));
      }

      // REGLA [NEGOCIO]: Visibilidad Pública vs Privada
      const isPublic = visibility === VisibilityStatusEnum.PUBLIC.toUpperCase();
      
      if (!isPublic && !isOwner) {
        return Either.makeLeft(AppErrorFactory.forbidden(appContext, "Access denied."));
      }

      // 2. Éxito: El Read Model queda inyectado y listo para que el Handler lo use
      return Either.makeRight(readModel);
    });
  }
}*/