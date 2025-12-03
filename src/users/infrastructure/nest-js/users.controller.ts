import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Optional } from 'src/core/types/optional';
import { CreateUserCommand } from 'src/users/application/commands/create-user/create-user.command';
import { GetUserByNameQuery } from 'src/users/application/queries/get-user-by-name/get-user-by-name.query';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Esto es un Command (CQRS)
  @Post()
  async createUser(@Body('name') name: string) {
    await this.commandBus.execute(new CreateUserCommand(name));
    return { message: 'User created successfully' };
  }

  // Esto es un query (CQRS)
  @Get()
  async getUserByName(@Body('name') name: string) {
    const userOptional: Optional<UserReadModel> = await this.queryBus.execute(
      new GetUserByNameQuery(name),
    );

    if (!userOptional.hasValue()) throw new NotFoundException(); // lanza 404

    return { user: userOptional.getValue() };
  }
}
