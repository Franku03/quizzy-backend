import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class SendSingleEmailDto {
  @IsNotEmpty({ message: 'El email del destinatario es requerido' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Formato de email inválido',
  })
  email: string;

  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString({ message: 'El título debe ser un texto' })
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,;:¡!¿?()\-_]+$/, {
    message: 'El título contiene caracteres no permitidos',
  })
  title: string;

  @IsNotEmpty({ message: 'El mensaje es requerido' })
  @IsString({ message: 'El mensaje debe ser un texto' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'El mensaje no puede exceder 1000 caracteres' })
  @Matches(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,;:¡!¿?()\-_"'\-@#$%&*+=|<>[\]{}]+$/, {
    message: 'El mensaje contiene caracteres no permitidos',
  })
  message: string;

  /**
   * Transforma el DTO en un objeto simple para el servicio
   */
  toEmailRequest(): { email: string; title: string; message: string } {
    return {
      email: this.email,
      title: this.title,
      message: this.message,
    };
  }
}