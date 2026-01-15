// SERVICIO DESCARTADO - EN DESUSO
import { Injectable, Inject } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { ISendNotificationService } from 'src/backoffice/domain/domain-services/send-notification.service.interface';
import { MassMessage } from 'src/backoffice/domain/aggregates/mass.message';
import type { IBackofficeDao } from 'src/backoffice/application/queries/ports/backoffice.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import {
  UserNotificationFilter,
  UserForNotification,
} from 'src/backoffice/application/read-model/backoffice-notifications.read.model';

@Injectable()
export class SendMassNotificationService implements ISendNotificationService {
  private readonly context = {
    service: 'SendNotificationService',
    module: 'backoffice',
  };

  constructor(
    @Inject(DaoName.Backoffice)
    private readonly backofficeDao: IBackofficeDao,
    private readonly mailerService: MailerService,
  ) {}

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

      // Enviar correos en segundo plano
      this.sendEmailsInBackground(users, massMessage);

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

  private sendEmailsInBackground(
    users: UserForNotification[],
    massMessage: MassMessage,
  ): void {
    // Usar setTimeout para ejecutar en segundo plano
    setTimeout(async () => {
      const title = massMessage.getTitle();
      const message = massMessage.getMessage();

      try {
        const BATCH_SIZE = 10;
        let successful = 0;
        let failed = 0;

        for (let i = 0; i < users.length; i += BATCH_SIZE) {
          const batch = users.slice(i, i + BATCH_SIZE);

          const batchPromises = batch.map(async (user) => {
            try {
              await this.sendSingleEmail(user.email, title, message, user.name);
              successful++;
              return { success: true, email: user.email };
            } catch {
              failed++;
              return { success: false, email: user.email };
            }
          });

          await Promise.allSettled(batchPromises);

          // Pequeña pausa entre lotes
          if (i + BATCH_SIZE < users.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        console.log(
          `Notification sent to ${successful} users, ${failed} failed`,
        );
      } catch {
        console.error('Batch email sending failed');
      }
    }, 0);
  }

  private async sendSingleEmail(
    to: string,
    subject: string,
    message: string,
    userName: string,
  ): Promise<void> {
    const htmlContent = this.generateEmailHtml(subject, message, userName);

    await this.mailerService.sendMail({
      to,
      subject: `Quizzy Notification: ${subject}`,
      text: message,
      html: htmlContent,
    });
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
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f7f9fc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            margin-bottom: 20px;
          }
          .message-box {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid #4299e1;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <div class="greeting">
              <h2>Hello ${userName},</h2>
            </div>
            <div class="message-box">
              <p>${safeMessage}</p>
            </div>
            <p>This is an automated notification from Quizzy.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Quizzy Platform</p>
            <p>This email was sent automatically.</p>
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
