import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteMemberDto {
    @IsString()
    @IsNotEmpty()
    groupId: string;

    @IsString()
    @IsNotEmpty()
    requesterId: string;

    @IsString()
    @IsNotEmpty()
    targetUserId: string;
}