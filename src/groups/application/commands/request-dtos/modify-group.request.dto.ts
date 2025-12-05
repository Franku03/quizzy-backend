import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateGroupDto {
    @IsString()
    @IsOptional()
    @Length(3, 20)
    name?: string;

    @IsString()
    @IsOptional()
    @Length(0, 200)
    description?: string;
}