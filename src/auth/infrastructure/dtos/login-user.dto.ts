import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString({ message: 'Username must be text.' })
  @IsNotEmpty({ message: 'Username is required.' })
  username: string;

  @IsString( { message: 'Password must be text.' })
  @IsNotEmpty( { message: 'Password is required.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;
}