import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@Injectable()
export class AuthService {
  constructor(
    @Inject(RepositoryName.User) 
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const emailVO = new UserEmail(email);
    
    const userOptional = await this.userRepository.findByEmail(emailVO);

    if (!userOptional.hasValue()) {
      return null;
    }

    const user = userOptional.getValue();

    const isMatch = await bcrypt.compare(pass, user.passwordHash.value);

    if (isMatch) {
      return { userId: user.id.value, email: user.email.value, role: user.type };
    }

    return null;
  }

  async login(user: any) {
    const payload = { 
        sub: user.userId,
        email: user.email,
        role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}