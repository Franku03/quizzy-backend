import { IsString, IsEmail, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  public readonly email: string;

  @IsString({ message: 'El nombre de usuario debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  @MinLength(6, { message: 'El nombre de usuario debe tener al menos 6 caracteres.' })
  @MaxLength(30, { message: 'El nombre de usuario no puede tener más de 30 caracteres.' })
  public readonly username: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  public readonly password: string;
}