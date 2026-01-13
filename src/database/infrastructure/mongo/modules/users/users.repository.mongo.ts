/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\users\users.repository.mongo.ts

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
import { RepositoryMongo } from '../../decorators/repository-mongo.decorator';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Optional } from 'src/core/types/optional'; 

@RepositoryMongo(RepositoryName.User)
@Injectable()
export class UserRepositoryMongo implements IUserRepository {
  constructor(
    @InjectModel(UserMongo.name)
    private readonly userModel: Model<UserMongo>,
  ) {}

  async save(user: User): Promise<void> {
    try {
      const persistenceData = UserMapper.toPersistence(user);
      await this.userModel.updateOne(
        { userId: persistenceData.userId },
        { $set: persistenceData },
        { upsert: true }
      ).exec();
    } catch (error) {
      throw new Error(`Error saving user: ${error.message}`);
    }
  }

  async findById(id: UserId): Promise<Optional<User>> {
    try {
      const document = await this.userModel
        .findOne({ userId: id.value })
        .exec();

      return document 
        ? new Optional(UserMapper.toDomain(document)) 
        : new Optional(); 
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  async findByEmail(email: UserEmail): Promise<Optional<User>> {
    try {
      const document = await this.userModel
        .findOne({ email: email.value })
        .exec();

      return document 
        ? new Optional(UserMapper.toDomain(document)) 
        : new Optional();
    } catch (error) {
      throw new Error(`Error finding user by Email: ${error.message}`);
    }
  }

  async findByUsername(username: UserName): Promise<Optional<User>> {
    try {
      const document = await this.userModel
        .findOne({ username: username.value })
        .exec();

      return document 
        ? new Optional(UserMapper.toDomain(document)) 
        : new Optional();
    } catch (error) {
      throw new Error(`Error finding user by Username: ${error.message}`);
    }
  }

  async existsUserByEmail(email: UserEmail): Promise<boolean> {
    try {
      const exists = await this.userModel
        .exists({ email: email.value })
        .exec();
      return exists !== null;
    } catch (error) {
      throw new Error(`Error checking email existence: ${error.message}`);
    }
  }

  async existsUserByUsername(username: UserName): Promise<boolean> {
    try {
      const exists = await this.userModel
        .exists({ username: username.value })
        .exec();
      return exists !== null;
    } catch (error) {
      throw new Error(`Error checking username existence: ${error.message}`);
    }
  }

  async deleteUser(id: UserId): Promise<void> {
    try {
      await this.userModel.deleteOne({ userId: id.value }).exec();
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
  
  async findAll(): Promise<User[]> {
    try {
      const documents = await this.userModel.find().exec();
      const validUsers: User[] = [];

      for (const doc of documents) {
        try {
            const user = UserMapper.toDomain(doc);
            validUsers.push(user);
        } catch (innerError) {
        }
      }

      return validUsers;
    } catch (error) {
      throw new Error(`Error fetching all users: ${error.message}`);
    }
  }
  
}