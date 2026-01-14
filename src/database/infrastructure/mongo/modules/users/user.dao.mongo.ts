/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\users\user.dao.mongo.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserDao } from 'src/users/application/queries/ports/users.dao.port';
import { UserMongo } from '../../entities/users.schema';
import { Optional } from 'src/core/types/optional';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

@DaoMongo(DaoName.User)
@Injectable()
export class UserDaoMongo implements IUserDao {
  
  constructor(
    @InjectModel(UserMongo.name)
    private readonly userModel: Model<UserMongo>,
  ) {}

  async getUserByName(name: string): Promise<Optional<UserReadModel>> {
    const user = await this.userModel
      .findOne({ username: name })
      .lean()
      .exec();

    if (!user) {
      return new Optional<UserReadModel>();
    }

    return new Optional<UserReadModel>(
      new UserReadModel(
        user.userId,
        user.email,
        user.username,
      ),
    );
  }

  async getUserById(id: string): Promise<Optional<UserReadModel>> {
    const user = await this.userModel
      .findOne({ userId: id })
      .lean()
      .exec();

    if (!user) {
      return new Optional<UserReadModel>();
    }

    return new Optional<UserReadModel>(
      new UserReadModel(
        user.userId,
        user.email,
        user.username,
      ),
    );
  }
}