/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\nest-js\decorators\get-user-id.decorator.ts

import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const GetUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    if (!request.user?.id) {
      throw new InternalServerErrorException(
        'El id del usuario no se encuentra dentro de la petición - (GetUserId decorator was used without an AuthGuard (or MockAuthGuard).)',
      );
    }

    // console.log(`User ID: ${request.user.id}`);
    return request.user.id;
  },
);
