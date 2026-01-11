import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class RegisterDeviceDto {
    @IsString({ message: 'El token debe ser un string.' })
    @IsNotEmpty({ message: 'El token es obligatorio.' })
    public readonly token: string;

    @IsString({ message: 'El tipo de dispositivo debe ser un string.' })
    @IsIn(['android', 'ios', 'web'], { message: 'El tipo de dispositivo debe ser android, ios o web.' })
    @IsNotEmpty({ message: 'El tipo de dispositivo es obligatorio.' })
    public readonly deviceType: string;
}
