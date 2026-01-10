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
import { IUserDao } from 'src/users/application/queries/ports/users.dao.port';
import { UserEntity } from '../../entities/users.entity';
import { Repository } from 'typeorm';
import { Optional } from 'src/core/types/optional';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

@DaoPostgres(DaoName.User)
@Injectable()
export class UserDaoPostgres implements IUserDao {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getUserByName(name: string): Promise<Optional<UserReadModel>> {
    const user = await this.userRepo.findOne({ where: { name } });
    if (!user) return new Optional<UserReadModel>();

    return new Optional<UserReadModel>(
      new UserReadModel('id-fake', 'email-fake', user.name),
    );
  }

  // 👇 AGREGAMOS ESTE MÉTODO FALTANTE
  async getUserById(id: string): Promise<Optional<UserReadModel>> {
    // Implementación temporal para que compile (ya que estás usando Mongo)
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) return new Optional<UserReadModel>();

    return new Optional<UserReadModel>(
      new UserReadModel(user.id, 'email-fake', 'name-fake'), // Ajusta según tu Entity real
    );
  }
}
