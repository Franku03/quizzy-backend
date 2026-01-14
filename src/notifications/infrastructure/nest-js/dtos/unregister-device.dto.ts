import { IsString, IsNotEmpty } from 'class-validator';

export class UnregisterDeviceDto {
    @IsString({ message: 'El token debe ser un string.' })
    @IsNotEmpty({ message: 'El token es obligatorio.' })
    public readonly token: string;
}
