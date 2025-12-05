import { IsISO8601, IsNotEmpty, IsString } from "class-validator";

export class AssignKahootToGroupDto {
    @IsString()
    @IsNotEmpty()
    quizId: string;

    @IsISO8601()
    @IsNotEmpty()
    availableFrom: Date;

    @IsISO8601()
    @IsNotEmpty()
    availableUntil: Date;
}