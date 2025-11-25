import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CreateUser } from 'src/users/application/use-cases/CreateUser';

@Controller('users')
export class UsersController {
  constructor(@Inject('CreateUser') private readonly createUser: CreateUser) {}

  @Post()
  async create(@Body('name') name: string) {
    await this.createUser.execute(name);
    return { message: 'User created successfully' };
  }
}
