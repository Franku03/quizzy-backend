/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\users\users.dao.postgres.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from '../../../catalogs/dao.catalog.enum'; 
import { UserEntity } from '../../entities/users.entity';
import { IUserDao } from 'src/users/application/queries/ports/users.dao.port';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';
import { Optional } from 'src/core/types/optional';
import { UserReadPgMapper } from './mappers/user.read.postgres.mapper';

@DaoPostgres(DaoName.User)
@Injectable()
export class UserDao implements IUserDao {

  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>
  ) {}

  async getUserByName(username: string): Promise<Optional<UserReadModel>> {
    const entity = await this.repository.findOne({ where: { username } });

    if (!entity) return new Optional();

    return new Optional(UserReadPgMapper.map(entity));
  }

  async getUserById(id: string): Promise<Optional<UserReadModel>> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) return new Optional();

    return new Optional(UserReadPgMapper.map(entity));
  }
}