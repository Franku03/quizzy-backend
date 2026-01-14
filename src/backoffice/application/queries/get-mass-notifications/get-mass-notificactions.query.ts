import { IQuery } from 'src/core/application/cqrs';

export enum OrderByEnum {
  CREATED_AT = 'createdAt',
}

export class GetMassNotificationsQuery implements IQuery {
  constructor(
    public readonly userId?: string, // id de la persona que envió la notificación
    public readonly limit: number = 20, // default: 20, max: 50
    public readonly page: number = 1, // default: 1
    public readonly orderBy: OrderByEnum = OrderByEnum.CREATED_AT, // default: "createdAt"
    public readonly order: 'asc' | 'desc' = 'asc', // default: "asc", dirección de ordenamiento
  ) {}
}
