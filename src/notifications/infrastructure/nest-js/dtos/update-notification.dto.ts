import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateNotificationDto {
    @IsBoolean({ message: 'isRead debe ser un booleano.' })
    @IsNotEmpty({ message: 'isRead es obligatorio.' })
    public readonly isRead: boolean;
}
