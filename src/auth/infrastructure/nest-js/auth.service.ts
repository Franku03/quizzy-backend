import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IPasswordHasher } from 'src/users/domain/domain-services/i.password-hasher.interface';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';

@Injectable()
export class AuthService {
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async login(loginDto: any) {
    const { email, password } = loginDto;
    
    const userOptional = await this.userRepository.findByEmail(new UserEmail(email));
    if (!userOptional.hasValue()) throw new UnauthorizedException('Credenciales no validas (email)');
    
    const user = userOptional.getValue();

    if (!await this.passwordHasher.compare(password, user.passwordHash.value)) {
      throw new UnauthorizedException('Credenciales no validas (contraseña)');
    }

    return {
      ...this.generateTokenResponse(user)
    };
  }

  async checkAuthStatus(userPayload: JwtPayload) {

    const id = new UserId(userPayload.id);

    const userOptional = await this.userRepository.findById(id);

    if (!userOptional.hasValue()) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const user = userOptional.getValue();
    
    return {
      ...this.generateTokenResponse(user)
    };
  }

  private generateTokenResponse(user: any) {
    const payload: JwtPayload = {
      id: user.id.value,
      email: user.email.value,
      roles: user.roles || ['user']
    };

    return {
      user: {
          id: user.id.value,
          email: user.email.value,
          roles: payload.roles
      },
      token: this.jwtService.sign(payload)
    };
  }
}