import { IsString, Matches, IsNotEmpty } from 'class-validator';

export class GenerateInvitationDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d+d$/, { message: 'El formato debe ser días, ej: "7d"' })
    expiresIn: string = "7d";
}