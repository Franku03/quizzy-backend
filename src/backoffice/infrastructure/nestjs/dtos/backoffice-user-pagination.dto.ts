import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { GetBackofficeUsersQuery } from 'src/backoffice/application/queries/get-backoffice-users/get-backoffice-users.query';

export enum OrderByEnum {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  USERTYPE = 'usertype',
  UPDATED_AT = 'updatedAt',
}

export enum OrderEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class BackofficeUserPaginationDto {
  @IsOptional()
  @IsString()
  name?: string; // nombre del creador

  @IsOptional()
  @IsString()
  userId?: string; // id del usuario

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20; // cantidad maxima de users por page (default: 20, max: 50)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1; // numero de pagina (default: 1)

  @IsOptional()
  @IsEnum(OrderByEnum)
  orderBy: OrderByEnum = OrderByEnum.CREATED_AT; // default: "createdAt"

  @IsOptional()
  @IsEnum(OrderEnum)
  order: OrderEnum = OrderEnum.ASC; // default: "asc", dirección de ordenamiento

  public toGetBackofficeUsersQuery(): GetBackofficeUsersQuery {
    // Construir objeto con solo los valores definidos
    const params: {
      name?: string;
      userId?: string;
      limit: number;
      page: number;
      orderBy: `${OrderByEnum}`;
      order: 'asc' | 'desc';
    } = {
      limit: this.limit,
      page: this.page,
      orderBy: this.orderBy as `${OrderByEnum}`,
      order: this.order,
    };

    if (this.name?.trim()) {
      params.name = this.name.trim();
    }

    if (this.userId?.trim()) {
      params.userId = this.userId.trim();
    }

    return new GetBackofficeUsersQuery(
      params.name,
      params.userId,
      params.limit,
      params.page,
      params.orderBy,
      params.order,
    );
  }
}
