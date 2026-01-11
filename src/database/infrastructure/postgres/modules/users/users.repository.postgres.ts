/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\users\users.repository.postgres.ts

import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { Injectable } from '@nestjs/common';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Optional } from 'src/core/types/optional'; // 👈 Agregamos el import

@RepositoryPostgres(RepositoryName.User)
@Injectable()
export class UserRepositoryPostgres implements IUserRepository {
  
  async save(user: User): Promise<void> { 
      throw new Error('Postgres no soportado'); 
  }
  async findById(id: UserId): Promise<Optional<User>> { 
      throw new Error('Postgres no soportado'); 
  }
  async findByEmail(email: UserEmail): Promise<Optional<User>> { 
      throw new Error('Postgres no soportado'); 
  }

  async existsUserByEmail(email: UserEmail): Promise<boolean> { 
      throw new Error('Postgres no soportado'); 
  }

  async findByUsername(username: UserName): Promise<Optional<User>> {
        throw new Error('Postgres no soportado'); 
    }

  async existsUserByUsername(username: UserName): Promise<boolean> { 
      throw new Error('Postgres no soportado'); 
  }

  async deleteUser(id: UserId): Promise<void> { 
      throw new Error('Postgres no soportado'); 
  }

    async findAll(): Promise<User[]> { 
        throw new Error('Postgres no soportado'); 
    }
}