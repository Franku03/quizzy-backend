// src/backoffice/infrastructure/services/resend-email.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { SendSingleEmailDto } from '../dtos/extra-send-message.dto'; 
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResendEmailService{
  private resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isDevMode: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('RESEND_API_KEY');
    this.fromEmail = this.configService.get('MAIL_FROM', 'notifications@quizzy.com');
    this.fromName = this.configService.get('MAIL_FROM_NAME', 'Quizzy Notifications');
    this.isDevMode = !apiKey;

    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY no configurada. Modo desarrollo activado.');
      console.warn('   Los emails se mostrarán en consola pero no se enviarán.');
    } else {
      this.resend = new Resend(apiKey);
      console.log('✅ Resend configurado correctamente');
    }
  }

  /**
   * Envía un email a un usuario específico con diseño profesional
   */
  async sendSingleEmail(dto: SendSingleEmailDto): Promise<void> {
    const { email, title, message } = dto.toEmailRequest();

    // Extraer nombre del email si es posible (parte antes del @)
    const userName = email.split('@')[0];
    const formattedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

    if (this.isDevMode) {
      this.logDevModeEmail(email, title, message, formattedUserName);
      return;
    }

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `Quizzy Notification: ${title}`,
        text: this.generatePlainTextEmail(message, formattedUserName),
        html: this.generateEmailHtml(title, message, formattedUserName),
      });

      console.log(`✅ Email enviado a: ${email}`);
    } catch (error) {
      console.error(`❌ Error enviando email a ${email}:`, error);
      throw new Error(`Failed to send email to ${email}: ${error.message}`);
    }
  }

  /**
   * Genera HTML para el email con diseño profesional
   */
  private generateEmailHtml(
    subject: string,
    message: string,
    userName: string,
  ): string {
    const safeMessage = this.escapeHtml(message).replace(/\n/g, '<br>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quizzy Notification: ${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.5px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: rgba(255, 255, 255, 0.9);
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            margin-bottom: 30px;
          }
          .greeting h2 {
            margin: 0 0 10px 0;
            font-size: 22px;
            color: #2d3748;
            font-weight: 600;
          }
          .greeting p {
            margin: 0;
            color: #718096;
            font-size: 15px;
          }
          .message-box {
            background: linear-gradient(135deg, #f6f9ff 0%, #edf2f7 100%);
            padding: 30px;
            border-radius: 10px;
            border-left: 5px solid #4299e1;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
          }
          .message-content {
            margin: 0;
            font-size: 16px;
            color: #4a5568;
            line-height: 1.7;
          }
          .info-box {
            background: #fffaf0;
            border: 1px solid #fed7d7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            font-size: 14px;
            color: #744210;
          }
          .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            margin: 0 0 10px 0;
          }
          .footer-links {
            margin-top: 15px;
          }
          .footer-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
            font-size: 13px;
          }
          .footer-links a:hover {
            text-decoration: underline;
          }
          .date {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 10px;
          }
          .highlight {
            background: linear-gradient(120deg, #dbeafe 0%, #dbeafe 100%);
            background-repeat: no-repeat;
            background-size: 100% 40%;
            background-position: 0 90%;
            padding: 0 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Quizzy</div>
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <div class="greeting">
              <h2>Hello ${userName},</h2>
              <p>You have an important notification from the Quizzy Platform.</p>
            </div>
            
            <div class="message-box">
              <p class="message-content">${safeMessage}</p>
            </div>
            
            <div class="info-box">
              <strong>Important:</strong> This is an automated notification from the Quizzy Platform. 
              Please do not reply to this email. If you need assistance, please contact our support team.
            </div>
            
            <p style="color: #718096; font-size: 14px;">
              <em>Thank you for being part of the Quizzy community!</em>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Quizzy Platform. All rights reserved.</p>
            <div class="footer-links">
              <a href="https://quizzy.com">Home</a> | 
              <a href="https://quizzy.com/privacy">Privacy Policy</a> | 
              <a href="https://quizzy.com/contact">Contact Support</a>
            </div>
            <div class="date">
              Sent on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera versión de texto plano para el email
   */
  private generatePlainTextEmail(message: string, userName: string): string {
    return `Hello ${userName},

You have received an important notification from the Quizzy Platform.

${message}

---
Important: This is an automated notification from the Quizzy Platform. 
Please do not reply to this email.

Thank you for being part of the Quizzy community!

Best regards,
The Quizzy Team

© ${new Date().getFullYear()} Quizzy Platform. All rights reserved.`;
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
  }

  /**
   * Muestra email en modo desarrollo
   */
  private logDevModeEmail(
    email: string,
    title: string,
    message: string,
    userName: string
  ): void {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('[DEV MODE] 📧 Email Preview (Resend not configured)');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`📬 To: ${email}`);
    console.log(`📌 Subject: Quizzy Notification: ${title}`);
    console.log(`👤 User: ${userName}`);
    console.log('──────────────────────────────────────────────────────────');
    console.log('📝 Message:');
    console.log(message);
    console.log('──────────────────────────────────────────────────────────');
    console.log('💡 Note: In production mode, this email would be sent with professional HTML formatting.');
    console.log('══════════════════════════════════════════════════════════\n');
  }
}