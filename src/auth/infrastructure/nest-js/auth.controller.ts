import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from '../decorators/auth.decorator';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(@Request() req: any) {
    const user = req.user as JwtPayload;
    return this.authService.checkAuthStatus(user);
  }
}