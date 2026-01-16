/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\domain\domain-services\verify-if-user-is-admin.service.interface.ts

import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { Either, ErrorData } from 'src/core/types';

export interface IVerifyIfUserIsAdminService {
  execute(userId: UserId): Promise<Either<ErrorData, boolean>>;
}
