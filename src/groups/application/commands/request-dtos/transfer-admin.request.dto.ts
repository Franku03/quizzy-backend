import { IsString, IsNotEmpty } from 'class-validator';

export class TransferAdminDto {
    @IsString()
    @IsNotEmpty()
    newAdminId: string;
}
