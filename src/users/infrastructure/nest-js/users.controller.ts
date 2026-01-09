import { Controller, Post, Body, Get, Patch, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

// DTOs
import { CreateUserDto } from './dtos/create-user.dto';
import { ChangeUsernameDto } from './dtos/change-username.dto';

// Commands & Queries
import { CreateUserCommand } from 'src/users/application/commands/create-user/create-user.command';
import { GetUserByIdQuery } from 'src/users/application/queries/get-user-by-id/get-user-by-id.query';
import { ChangeUsernameCommand } from 'src/users/application/commands/change-username/change-username.command';
import { DeleteUserCommand } from 'src/users/application/commands/delete-user/delete-user.command';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';

@Controller('users')
export class UsersController {
  
  constructor(
    private readonly executor: CommandQueryExecutorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto.email, dto.username, dto.password);

    const userId = await this.executor.executeCommand<string>(command);
    
    return { 
        message: 'User created successfully', 
        userId: userId
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const query = new GetUserByIdQuery(id);
    return await this.executor.executeQuery<UserReadModel>(query);
  }

  @Patch(':id/username')
  async changeUsername(
    @Param('id') id: string,
    @Body() dto: ChangeUsernameDto
  ) {
    const command = new ChangeUsernameCommand(id, dto.newUsername);
    await this.executor.executeCommand(command);
    return { message: 'Username updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    const command = new DeleteUserCommand(id);
    await this.executor.executeCommand(command);
  }
}