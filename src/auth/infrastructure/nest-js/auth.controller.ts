import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';

class LoginDto {
    email: string;
    password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    return this.authService.login(user);
  }
}