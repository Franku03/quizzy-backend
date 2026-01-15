/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\application\helpers\backoffice-notification-user-read-model.builder.ts

import {
  BackofficeNotificationReadModel,
  NotificationSender,
} from '../read-model/backoffice-notifications.read.model';

// Helper para construir notificaciones
export class BackofficeNotificationReadModelBuilder {
  private id = '';
  private title = '';
  private message = '';
  private createdAt = '';
  private sender: NotificationSender = {
    imageUrl: null,
    id: '',
    name: '',
    email: '',
  };

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withMessage(message: string): this {
    this.message = message;
    return this;
  }

  withCreatedAt(createdAt: string): this {
    this.createdAt = createdAt;
    return this;
  }

  withSender(sender: NotificationSender): this {
    this.sender = sender;
    return this;
  }

  withSenderDetails(
    id: string,
    name: string,
    email: string,
    imageUrl: string | null = null,
  ): this {
    this.sender = {
      id,
      name,
      email,
      imageUrl,
    };
    return this;
  }

  build(): BackofficeNotificationReadModel {
    return new BackofficeNotificationReadModel(
      this.id,
      this.title,
      this.message,
      this.createdAt,
      this.sender,
    );
  }
}

// Ejemplo de uso:
/*
const notification = new BackofficeNotificationReadModelBuilder()
  .withId('uuid-123')
  .withTitle('Mantenimiento Programado')
  .withMessage('Se realizará mantenimiento el día...')
  .withCreatedAt('2024-01-10T10:30:00Z')
  .withSenderDetails(
    'user-456',
    'Admin Sistema',
    'admin@quizzy.com',
    'avatar-id-789'
  )
  .build();
*/
