import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from '../decorators/auth.decorator';
import { LoginUserDto } from '../dtos/login-user.dto';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { throwResult } from 'src/core/errors/helpers/exception-bridge.helper';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginUserDto) {
    return throwResult(await this.authService.login(loginDto));
  }

  @Get('check-status')
  @Auth()
  async checkAuthStatus(@GetUserId() userId: string) {
    return throwResult(await this.authService.checkAuthStatus(userId));
  }
}