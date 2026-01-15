// File: src/backoffice/infrastructure/services/resend-notification.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Resend } from 'resend';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { ISendNotificationService } from 'src/backoffice/domain/domain-services/send-notification.service.interface';
import { MassMessage } from 'src/backoffice/domain/aggregates/mass.message';
import type { IBackofficeDao } from 'src/backoffice/application/queries/ports/backoffice.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { ConfigService } from '@nestjs/config';
import {
  UserForNotification,
  UserNotificationFilter,
} from 'src/backoffice/application/read-model/backoffice-notifications.read.model';

@Injectable()
export class ResendNotificationService implements ISendNotificationService {
  private readonly context = {
    service: 'ResendNotificationService',
    module: 'backoffice',
  };

  private resend: Resend;

  constructor(
    @Inject(DaoName.Backoffice)
    private readonly backofficeDao: IBackofficeDao,
    private readonly configService: ConfigService,
  ) {
    // Configurar Resend
    const apiKey = this.configService.get('RESEND_API_KEY');

    if (!apiKey) {
      console.warn(
        '⚠️ RESEND_API_KEY no configurada. Modo desarrollo activado.',
      );
      console.warn(
        '   Los emails se mostrarán en consola pero no se enviarán.',
      );
    } else {
      this.resend = new Resend(apiKey);
      console.log('✅ Resend configurado correctamente');

      // Verificar que estamos usando un dominio de prueba
      const fromEmail = this.configService.get('MAIL_FROM');
      if (
        fromEmail &&
        !fromEmail.includes('resend.dev') &&
        !fromEmail.includes('shipwithresend.com')
      ) {
        console.warn(
          `⚠️  Advertencia: El email "${fromEmail}" puede necesitar verificación de dominio.`,
        );
        console.warn(
          `   Considera usar: notifications@resend.dev o hello@shipwithresend.com`,
        );
      }
    }
  }

  async execute(massMessage: MassMessage): Promise<Either<ErrorData, void>> {
    const massMessageId = massMessage.massMessageId.value;

    try {
      // Crear el filtro basado en el mensaje
      const filter: UserNotificationFilter = {
        sendToAdmins: massMessage.getFilterSendToAdmins(),
        sendToRegularUsers: massMessage.getFilterSendToRegularUsers(),
      };

      // Obtener usuarios según los filtros
      const usersResult =
        await this.backofficeDao.getUsersForNotification(filter);

      if (usersResult.isLeft()) {
        return Either.makeLeft(usersResult.getLeft());
      }

      const users = usersResult.getRight();

      if (users.length === 0) {
        return Either.makeRight(undefined);
      }

      // Enviar correos en segundo plano usando Resend
      this.sendEmailsWithResend(users, massMessage);

      return Either.makeRight(undefined);
    } catch (error) {
      return this.handleError(
        'NOTIFICATION_SEND_ERROR',
        error instanceof Error ? error.message : 'Failed to send notifications',
        error,
        { massMessageId },
      );
    }
  }

  private sendEmailsWithResend(
    users: UserForNotification[],
    massMessage: MassMessage,
  ): void {
    // Usar setTimeout para ejecutar en segundo plano
    setTimeout(async () => {
      const title = massMessage.getTitle();
      const message = massMessage.getMessage();
      const fromEmail = this.configService.get(
        'MAIL_FROM',
        'notifications@quizzy.com',
      );
      const fromName = this.configService.get(
        'MAIL_FROM_NAME',
        'Quizzy Notifications',
      );

      // Si no hay API Key, solo logueamos (modo desarrollo)
      if (!this.resend) {
        console.log(`[DEV] Se enviarían ${users.length} notificaciones:`);
        console.log(`[DEV] Título: ${title}`);
        console.log(`[DEV] Mensaje: ${message}`);
        users.forEach((user) => {
          console.log(`[DEV] → Para: ${user.name} <${user.email}>`);
        });
        return;
      }

      try {
        const BATCH_SIZE = 10; // Resend maneja bien los batches
        let successful = 0;
        let failed = 0;

        for (let i = 0; i < users.length; i += BATCH_SIZE) {
          const batch = users.slice(i, i + BATCH_SIZE);

          // Enviar cada email individualmente (Resend no tiene batch API todavía)
          const emailPromises = batch.map(async (user) => {
            try {
              await this.resend.emails.send({
                from: `${fromName} <${fromEmail}>`,
                to: user.email,
                subject: `Quizzy Notification: ${title}`,
                text: message,
                html: this.generateEmailHtml(title, message, user.name),
              });
              successful++;
              return { success: true, email: user.email };
            } catch (emailError) {
              failed++;
              console.error(`Error enviando a ${user.email}:`, emailError);
              return { success: false, email: user.email, error: emailError };
            }
          });

          await Promise.allSettled(emailPromises);

          // Pequeña pausa entre lotes
          if (i + BATCH_SIZE < users.length) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        console.log(
          `✅ Resend: Enviados ${successful} emails, ${failed} fallidos`,
        );
      } catch (error) {
        console.error('❌ Error en envío por Resend:', error);
      }
    }, 0);
  }

  private generateEmailHtml(
    subject: string,
    message: string,
    userName: string,
  ): string {
    const safeMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quizzy Notification: ${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            margin-bottom: 25px;
          }
          .message-box {
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid #4299e1;
            margin-bottom: 25px;
          }
          .footer {
            background: #f1f5f9;
            padding: 25px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
          </div>
          <div class="content">
            <div class="greeting">
              <h2 style="margin: 0 0 10px 0;">Hello ${userName},</h2>
              <p>You have a new notification from Quizzy.</p>
            </div>
            <div class="message-box">
              <p style="margin: 0; font-size: 16px; color: #475569;">${safeMessage}</p>
            </div>
            <p>This is an automated notification.</p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Quizzy Platform</p>
            <p style="margin: 0; font-size: 13px;">This email was sent automatically. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private handleError(
    code: string,
    message: string,
    error: unknown,
    extraContext?: Record<string, unknown>,
  ): Either<ErrorData, void> {
    const errorData = new ErrorData(code, message, ErrorLayer.INFRASTRUCTURE, {
      ...this.context,
      ...extraContext,
      errorDetails: error instanceof Error ? error.message : String(error),
    });
    return Either.makeLeft(errorData);
  }
}
