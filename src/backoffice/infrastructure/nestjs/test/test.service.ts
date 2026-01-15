// test-resend.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendTestService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY no configurada. Modo desarrollo.');
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async testResend() {
    const fromEmail = process.env.MAIL_FROM || 'notifications@quizzy.com';
    const fromName = process.env.MAIL_FROM_NAME || 'Quizzy Notifications';
    const testEmail = 'la.ochoa30pagos@gmail.com'; // Cambia esto

    if (!this.resend) {
      console.log('[DEV] Resend no configurado. Este es un email de prueba:');
      console.log(`De: ${fromName} <${fromEmail}>`);
      console.log(`Para: ${testEmail}`);
      console.log('Asunto: ✅ Prueba de Resend - Quizzy');
      console.log('Mensaje: Victor le dice a joel, subete a mi motora!');
      return;
    }

    try {
      await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: testEmail,
        subject: '✅ Prueba de Resend - Quizzy',
        text: '¡Resend funciona correctamente!',
        html: '<strong>¡Resend funciona correctamente!</strong>',
      });
      
      console.log('✅ Email de prueba enviado con Resend');
    } catch (error) {
      console.error('❌ Error enviando con Resend:', error);
    }
  }
}