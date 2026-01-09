import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IPasswordHasher } from 'src/users/domain/domain-services/i.password-hasher.interface';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { LoginUserDto } from '../dtos/login-user.dto';
import { User } from 'src/users/domain/aggregates/user';

@Injectable()
export class AuthService {
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;

    const userOptional = await this.userRepository.findByEmail(
      new UserEmail(email),
    );
    if (!userOptional.hasValue())
      throw new UnauthorizedException('Credenciales no validas (email)');

    const user = userOptional.getValue();

    // Verificar si el usuario está bloqueado
    if (user.isBlocked()) {
      throw new UnauthorizedException('Usuario bloqueado');
    }

    // Verificar si el usuario está activo
    if (!user.isActive()) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    if (
      !(await this.passwordHasher.compare(password, user.passwordHash.value))
    ) {
      throw new UnauthorizedException('Credenciales no validas (contraseña)');
    }

    return this.generateTokenResponse(user);
  }

  async checkAuthStatus(userId: string) {
    const id = new UserId(userId);

    const userOptional = await this.userRepository.findById(id);

    if (!userOptional.hasValue()) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const user = userOptional.getValue();

    // Verificar estado del usuario
    if (user.isBlocked()) {
      throw new UnauthorizedException('Usuario bloqueado');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    return this.generateTokenResponse(user);
  }

  private generateTokenResponse(user: User) {
    // Usar los roles del usuario directamente
    const roles = [...user.roles]; // Copia del array de roles

    /*
    // Opcional: agregar 'premium' si el usuario es premium
    if (user.isUserPremium && user.isUserPremium()) {
      roles.push('premium'); // Nota: necesitarías agregar UserRole.PREMIUM al enum
    }
    */

    const payload: JwtPayload = {
      id: user.id.value,
      email: user.email.value,
      roles: roles,
    };

    return {
      user: {
        id: user.id.value,
        email: user.email.value,
        username: user.username.value,
        state: user.state, // Nuevo: incluir estado
        roles: payload.roles,
        isAdmin: user.isAdmin(), // Método helper para compatibilidad
        profile: {
          name: user.userProfileDetails.name,
          avatarUrl: user.userProfileDetails.avatarImageURL,
        },
      },
      token: this.jwtService.sign(payload),
    };
  }

  public loginAfterRegister(user: User) {
    return this.generateTokenResponse(user);
  }
}
