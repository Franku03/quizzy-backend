import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IPasswordHasher } from 'src/users/domain/domain-services/i.password-hasher.interface';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { LoginUserDto } from '../dtos/login-user.dto';
import { User } from 'src/users/domain/aggregates/user';
import { Either } from 'src/core/types/either';
import { ErrorData, ErrorLayer } from 'src/core/types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async login(loginDto: LoginUserDto): Promise<Either<ErrorData, any>> {
    const { username, password } = loginDto;

    const userOptional = await this.userRepository.findByUsername(
      new UserName(username),
    );
    if (!userOptional.hasValue())
      return Either.makeLeft(
        new ErrorData(
          'INVALID_CREDENTIALS',
          'Credenciales no validas (username)',
          ErrorLayer.DOMAIN,
        ),
      );

    const user = userOptional.getValue();

    // Verificar si el usuario está bloqueado
    if (user.isBlocked()) {
      return Either.makeLeft(
        new ErrorData(
          'ACCOUNT_BLOCKED',
          'Usuario bloqueado',
          ErrorLayer.DOMAIN,
        ),
      );
    }

    // Verificar si el usuario está activo
    if (!user.isActive()) {
      return Either.makeLeft(
        new ErrorData(
          'ACCOUNT_INACTIVE',
          'Usuario inactivo',
          ErrorLayer.DOMAIN,
        ),
      );
    }

    if (
      !(await this.passwordHasher.compare(password, user.passwordHash.value))
    ) {
      return Either.makeLeft(
        new ErrorData(
          'INVALID_CREDENTIALS',
          'Credenciales no validas (contraseña)',
          ErrorLayer.DOMAIN,
        ),
      );
    }

    return Either.makeRight(this.generateTokenResponse(user));
  }

  async checkAuthStatus(userId: string): Promise<Either<ErrorData, any>> {
    const id = new UserId(userId);

    const userOptional = await this.userRepository.findById(id);

    if (!userOptional.hasValue()) {
      return Either.makeLeft(
        new ErrorData(
          'INVALID_CREDENTIALS',
          'Usuario no encontrado',
          ErrorLayer.DOMAIN,
        ),
      );
    }

    const user = userOptional.getValue();

    // Verificar estado del usuario
    if (user.isBlocked()) {
      return Either.makeLeft(
        new ErrorData(
          'ACCOUNT_BLOCKED',
          'Usuario bloqueado',
          ErrorLayer.DOMAIN,
        ),
      );
    }

    if (!user.isActive()) {
      return Either.makeLeft(
        new ErrorData(
          'ACCOUNT_INACTIVE',
          'Usuario inactivo',
          ErrorLayer.DOMAIN,
        ),
      );
    }

    return Either.makeRight(this.generateTokenResponse(user));
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
      username: user.username.value,
      email: user.email.value,
      roles: roles,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id.value,
        email: user.email.value,
        username: user.username.value,
        type: user.type,
        state: user.state, // Nuevo: incluir estado
        // roles: payload.roles,
        // isAdmin: user.isAdmin(), // Método helper para compatibilidad
        preferences: {
          theme: user.userPreferences.themePreference
       },
        userProfileDetails: {
          name: user.userProfileDetails.name,
          description: user.userProfileDetails.description,
          avatarAssetUrl: null,
        },
        isPremium: user.isUserPremium(),
      },
    };
  }

}