import { IsString, IsUUID, Matches, MaxLength, MinLength } from "class-validator";

export class PlayerJoinDto {


    @IsString()
    @Matches(/^\d{6,10}$/, {message: 'Invalid PIN'})
    sessionPin: string;

    @IsString()
    @MinLength(4)
    @MaxLength(20)
    nickname: string;

    // TODO: Quitar Id cuando haya JWT Strategy
    @IsUUID()
    userId: string;

}