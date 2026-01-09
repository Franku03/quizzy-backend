import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { CommandBus, QueryBus } from 'src/core/infrastructure/cqrs';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { ValidRoles } from 'src/auth/infrastructure/interfaces/jwt-payload.interface';

@Controller('backoffice')
export class BackofficeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @HttpCode(200)
  @Auth(ValidRoles.ADMIN)
  @Post()
  async create(@GetUserId() userId: string) {
    return { message: `admin with id ${userId} tried to create` };
  }
}
