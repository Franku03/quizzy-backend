/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\aspects\auth\strategies\userOwnership.strategy.ts

import { IAuthorizer } from '../authorizer.interface';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';

export interface IUserOwnershipRequest {
  userId: string;
  targetUserId: string;
}

export class UserOwnershipAuthorizer implements IAuthorizer<IUserOwnershipRequest, IUserRepository> {
  async authorize(command: IUserOwnershipRequest, context: IUserRepository): Promise<void> {
    if (command.userId !== command.targetUserId) {
      throw new Error("Unauthorized: You can only modify your own profile.");
    }
  }
}