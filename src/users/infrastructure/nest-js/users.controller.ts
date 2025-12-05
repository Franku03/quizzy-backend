import { Body, Controller, Post, Get, Patch, Delete, Param, HttpCode, HttpStatus, ConflictException, BadRequestException, InternalServerErrorException, NotFoundException 
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserDto } from './dtos/create-user.dto';
import { CreateUserCommand } from 'src/users/application/commands/create-user/create-user.command';
import { Either } from 'src/core/types/either';
import { CREATE_USER_ERROR_CODES } from 'src/users/application/commands/create-user/create-user.errors';
import { InvalidArgumentError } from 'src/users/domain/errors/invalid.argument.error';
import { GetUserByIdQuery } from 'src/users/application/queries/get-user-by-id/get-user-by-id.query';
import { ChangeUsernameDto } from './dtos/change-username.dto';
import { ChangeUsernameCommand } from 'src/users/application/commands/change-username/change-username.command';
import { UserNotFoundError } from 'src/users/domain/errors/user-not-found.error';
import { CHANGE_USERNAME_ERRORS } from 'src/users/application/commands/change-username/change-username.errors';
import { DeleteUserCommand } from 'src/users/application/commands/delete-user/delete-user.command';

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

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const query = new GetUserByIdQuery(id);
    const result = await this.queryBus.execute(query);

    if (result.isRight()) {
      return result.getRight();
    } else {
      this.handleError(result.getLeft());
    }
  }

  @Patch(':id/username')
    async changeUsername(
        @Param('id') id: string,
        @Body() dto: ChangeUsernameDto
    ) {
        const command = new ChangeUsernameCommand(id, dto.newUsername);
        const result = await this.commandBus.execute(command);

        if (result.isRight()) {
            return { message: 'Username updated successfully' };
        } else {
            this.handleError(result.getLeft());
        }
    }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    const command = new DeleteUserCommand(id);
    const result = await this.commandBus.execute(command);

    if (result.isRight()) {
      return { message: 'User deleted successfully' };
    } else {
      this.handleError(result.getLeft());
    }
  }

  private handleError(error: Error): never {

  if (error instanceof UserNotFoundError) {
      throw new NotFoundException(error.message);
  }
  if (error.message === CHANGE_USERNAME_ERRORS.USERNAME_ALREADY_TAKEN) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
  }
  if (error.message.includes('Solo puedes cambiar tu nombre de usuario una vez al año')) {
      throw new BadRequestException(error.message);
  }

    if (error.message === 'USER_NOT_FOUND') {
      throw new NotFoundException('User not found');
    }
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