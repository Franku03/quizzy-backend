import { IsUUID } from "class-validator";

export class CreateSessionDto {

    @IsUUID()
    kahootId: string

    // TODO: Por ahora esto esta aqui, luego lo cambiare al header con el JWT
    @IsUUID()
    userId: string

}