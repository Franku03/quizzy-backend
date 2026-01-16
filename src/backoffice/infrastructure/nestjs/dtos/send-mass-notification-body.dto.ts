/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\infrastructure\nestjs\dtos\send-mass-notification-body.dto.ts

import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SendMassNotificationCommand } from 'src/backoffice/application/commands/send-mass-notification/send-mass-notification.command';

export class NotificationFiltersDto {
  @IsOptional()
  @IsBoolean()
  toAdmins: boolean = false;

  @IsOptional()
  @IsBoolean()
  toRegularUsers: boolean = false;
}

export class SendMassNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string; // ej. "mantenimiento programado"

  @IsNotEmpty()
  @IsString()
  message: string; // ej. "Estimado usuario, hola"

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationFiltersDto)
  filters?: NotificationFiltersDto;

  public toSendMassNotificationCommand(
    senderId: string,
  ): SendMassNotificationCommand {
    return new SendMassNotificationCommand(
      senderId,
      this.title,
      this.message,
      this.filters?.toAdmins || false,
      this.filters?.toRegularUsers || false,
    );
  }
}
