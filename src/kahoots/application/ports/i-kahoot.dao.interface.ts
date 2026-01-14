/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\ports\i-kahoot.dao.interface.ts

import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { Either, ErrorData } from 'src/core/types';
import { KahootUserDetailReadModel } from '../dtos/kahoot-user-detail.read.model.dto';

export interface IKahootDao {
  getKahootById(id: string): Promise<Either<ErrorData, KahootSnapshot | null>>;
  getKahootValidationDataByKahootId(
    id: string,
  ): Promise<Either<ErrorData, { userId: string; visibility: string } | null>>;
  getKahootUserDetail(
    kahootId: string,
    userId: string,
  ): Promise<Either<ErrorData, KahootUserDetailReadModel | null>>;
}
