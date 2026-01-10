import { Either } from 'src/core/types/either';
import { ErrorData } from 'src/core/types';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator'; // Tu decorador Auth

import { Controller, Post, Body, Get, Patch, Delete, Param, HttpCode, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

import { AuthService } from 'src/auth/infrastructure/nest-js/auth.service';

// DTOs
import { CreateUserDto } from './dtos/create-user.dto';
import { ChangeUsernameDto } from './dtos/change-username.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';

// Commands & Queries
import { CreateUserCommand } from 'src/users/application/commands/create-user/create-user.command';
import { GetUserByIdQuery } from 'src/users/application/queries/get-user-by-id/get-user-by-id.query';
import { ChangeUsernameCommand } from 'src/users/application/commands/change-username/change-username.command';
import { DeleteUserCommand } from 'src/users/application/commands/delete-user/delete-user.command';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';
import { RegisterUserCommand } from 'src/users/application/commands/register-user/register-user.command';
import { GetUserProfileQuery } from 'src/users/application/queries/get-user-profile/get-user-profile.query';
import { GetPublicProfileQuery } from 'src/users/application/queries/get-public-profile/get-public-profile.query';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { UpdateProfileCommand } from 'src/users/application/commands/update-profile/update-profile.command';

import { throwResult } from 'src/core/errors/helpers/exception-bridge.helper';
import { User } from 'src/users/domain/aggregates/user';

@Controller('user')
export class UsersController {
  
  constructor(
    private readonly executor: CommandQueryExecutorService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserDto) {
    const command = new RegisterUserCommand({ ...dto });
    
    const userReadModel = throwResult(await this.executor.executeCommand(command));
    
    return { user: userReadModel };
  }

  @Get('profile')
  @Auth()
  async getUserProfile(@GetUserId() userId: string) {
    const query = new GetUserProfileQuery({ 
      userId: userId, 
      targetUserId: userId 
  });
    const result = await this.executor.executeQuery(query);
    return { 
        user: throwResult(result) 
    };
  }

  @Patch('profile')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async updateProfile(@GetUserId() userId: string, @Body() dto: UpdateProfileDto) {
      const command = new UpdateProfileCommand({
          userId: userId, 
          targetUserId: userId,
          ...dto
      });
      
      const userReadModel = throwResult(await this.executor.executeCommand(command));
      
      return { user: userReadModel };
  }

  @Get('profile/id/:id')
  async getPublicProfile(@Param('id') id: string) {
    const query = new GetPublicProfileQuery({ targetUserId: id });
      return throwResult(await this.executor.executeQuery(query));
  }

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