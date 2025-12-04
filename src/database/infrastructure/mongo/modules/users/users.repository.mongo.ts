import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserMongo } from '../../entities/users.schema';
import { User } from 'src/users/domain/aggregates/user';
import { UserMapper } from 'src/users/infrastructure/mappers/user.mapper';

import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';


@Injectable()
export class UserRepositoryMongo implements IUserRepository {

  constructor(
    @InjectModel(UserMongo.name)
    private readonly userModel: Model<UserMongo>,
  ) {}

  async save(user: User): Promise<void> {
    const persistenceData = UserMapper.toPersistence(user);

    await this.userModel.updateOne(
      { userId: persistenceData.userId },
      { $set: persistenceData },
      { upsert: true }
    ).exec();
  }

  async findUserById(id: UserId): Promise<User | null> {
    const document = await this.userModel
      .findOne({ userId: id.value })
      .exec();

    return document ? UserMapper.toDomain(document) : null;
  }

  async findUserByEmail(email: UserEmail): Promise<User | null> {
    const document = await this.userModel
      .findOne({ email: email.value })
      .exec();

    return document ? UserMapper.toDomain(document) : null;
  }

  async existsUserByEmail(email: UserEmail): Promise<boolean> {
    const exists = await this.userModel
      .exists({ email: email.value })
      .exec();

    return exists !== null;
  }

  async existsUserByUsername(username: UserName): Promise<boolean> {
    const exists = await this.userModel
      .exists({ username: username.value })
      .exec();

    return exists !== null;
  }

  async deleteUser(id: UserId): Promise<void> {
    await this.userModel.deleteOne({ userId: id.value }).exec();
  }
}
