/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\users\users.repository.postgres.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { Optional } from 'src/core/types/optional';
import { UserEntity } from '../../entities/users.entity';
import { UserPersistencePgMapper } from './mappers/user.postgres.mapper';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@RepositoryPostgres(RepositoryName.User)
@Injectable()
export class UserRepositoryPostgres implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<void> {
    const entity = UserPersistencePgMapper.toPersistence(user);
    await this.repository.save(entity);
  }

  async findById(id: UserId): Promise<Optional<User>> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    
    if (!entity) return new Optional();

    return new Optional(UserPersistencePgMapper.toDomain(entity));
  }

  async findByEmail(email: UserEmail): Promise<Optional<User>> {
    const entity = await this.repository.findOne({ where: { email: email.value } });

    if (!entity) return new Optional();

    return new Optional(UserPersistencePgMapper.toDomain(entity));
  }

  async findByUsername(username: UserName): Promise<Optional<User>> {
    const entity = await this.repository.findOne({ where: { username: username.value } });

    if (!entity) return new Optional();

    return new Optional(UserPersistencePgMapper.toDomain(entity));
  }

  async existsUserByEmail(email: UserEmail): Promise<boolean> {
    const count = await this.repository.count({ where: { email: email.value } });
    return count > 0;
  }

  async existsUserByUsername(username: UserName): Promise<boolean> {
    const count = await this.repository.count({ where: { username: username.value } });
    return count > 0;
  }

  async deleteUser(id: UserId): Promise<void> {
    await this.repository.delete(id.value);
  }

  async findAll(): Promise<User[]> {
    const entities = await this.repository.find();
    return entities.map(UserPersistencePgMapper.toDomain);
  }
}