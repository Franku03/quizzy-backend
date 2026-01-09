import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from '../decorators/auth.decorator';
import { LoginUserDto } from '../dtos/login-user.dto';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(@GetUserId() userId: string) {
    return this.authService.checkAuthStatus(userId);
  }
}