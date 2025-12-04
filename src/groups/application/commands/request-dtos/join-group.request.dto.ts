import { IsNotEmpty, IsString } from "class-validator";

export class JoinGroupDto {
    @IsString()
    @IsNotEmpty()
    invitationToken: string;
}