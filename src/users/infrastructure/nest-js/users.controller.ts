import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  Param, 
  HttpCode, 
  HttpStatus, 
  ConflictException, 
  BadRequestException, 
  InternalServerErrorException, 
  NotFoundException 
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateUserDto } from './dtos/create-user.dto';

import { CreateUserCommand } from '../../application/commands/create-user/create-user.command';

import { Either } from 'src/core/types/either';
import { CREATE_USER_ERROR_CODES } from '../../application/commands/create-user/create-user.errors';
import { InvalidArgumentError } from 'src/users/domain/errors/invalid.argument.error';

@Controller('users')
export class UsersController {
  
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}


  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(
        dto.email,
        dto.username,
        dto.password
    );

    const result: Either<Error, string> = await this.commandBus.execute(command);

    if (result.isRight()) {
        return { 
            message: 'User created successfully', 
            userId: result.getRight()
        };
    } else {
        this.handleError(result.getLeft());
    }
  }

  // --- QUERIES (Lectura - Futuro) ---
  
  /* @Get(':id')
  async getUser(@Param('id') id: string) {
      // ... lógica similar usando queryBus ...
  }
  */

  private handleError(error: Error): never {
    if (
      error.message === CREATE_USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS ||
      error.message === CREATE_USER_ERROR_CODES.USER_USERNAME_ALREADY_EXISTS 
  ) {
      throw new ConflictException(error.message);
  }

    if (error instanceof InvalidArgumentError) {
        throw new BadRequestException(error.message);
    }

    if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
    }

    console.error(error); 
    throw new InternalServerErrorException('Unexpected error creating user');
}
}