import { IsEmail, IsString, MinLength, MaxLength, IsEnum, IsNotEmpty } from 'class-validator';
import { UserType } from 'src/users/domain/value-objects/user.type';

export class RegisterUserDto {
  @IsEmail({}, { message: 'The email format is invalid.' })
  @IsNotEmpty({ message: 'Email is required.' })
  public readonly email: string;

  @IsString({ message: 'The username must be text.' })
  @IsNotEmpty({ message: 'Username is required.' })
  @MinLength(6, { message: 'The username must be at least 6 characters long.' })
  @MaxLength(30, { message: 'The username cannot be longer than 30 characters.' })
  public readonly username: string;

  @IsString({ message: 'The password must be text.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6, { message: 'The password must be at least 6 characters long.' })
  public readonly password: string;

  @IsString({ message: 'The name must be text.' })
  @IsNotEmpty({ message: 'Name is required.' })
  @MaxLength(148, { message: 'The name cannot be longer than 148 characters.' })
  name: string;

  @IsEnum(UserType, { message: 'The user type must be a valid option ("STUDENT" or "TEACHER").' })
  type: UserType;
}