/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\application\queries\get-mass-notifications\get-mass-notificactions.query.ts

import { IQuery } from 'src/core/application/cqrs';

export enum OrderByEnum {
  CREATED_AT = 'createdAt',
}

export class GetMassNotificationsQuery implements IQuery {
  constructor(
    public readonly userId?: string, // id de la persona que envió la notificación
    public readonly limit: number = 20, // default: 20, max: 50
    public readonly page: number = 1, // default: 1
    public readonly orderBy: OrderByEnum = OrderByEnum.CREATED_AT, // default: "createdAt"
    public readonly order: 'asc' | 'desc' = 'asc', // default: "asc", dirección de ordenamiento
  ) {}
}
