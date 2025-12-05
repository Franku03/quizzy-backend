import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ChangeUsernameDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(30)
    public readonly newUsername: string;
}