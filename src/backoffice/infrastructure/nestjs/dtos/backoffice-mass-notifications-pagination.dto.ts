/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\infrastructure\nestjs\dtos\backoffice-mass-notifications-pagination.dto.ts

import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { GetMassNotificationsQuery } from 'src/backoffice/application/queries/get-mass-notifications/get-mass-notificactions.query';

export enum OrderByEnum {
  CREATED_AT = 'createdAt',
}

export enum OrderEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class BackofficeMassNotificationPaginationDto {
  @IsOptional()
  @IsString()
  userId?: string; // id de la persona que envió la notificación

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20; // default: 20, max: 50

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1; // default: 1

  @IsOptional()
  @IsEnum(OrderByEnum)
  orderBy: OrderByEnum = OrderByEnum.CREATED_AT; // default: "createdAt"

  @IsOptional()
  @IsEnum(OrderEnum)
  order: OrderEnum = OrderEnum.ASC; // default: "asc", dirección de ordenamiento

  public toGetMassNotificationsQuery(): GetMassNotificationsQuery {
    const params = {
      userId: this.userId?.trim() || undefined,
      limit: this.limit,
      page: this.page,
      orderBy: this.orderBy,
      order: this.order,
    };

    return new GetMassNotificationsQuery(
      params.userId,
      params.limit,
      params.page,
      params.orderBy,
      params.order,
    );
  }
}
