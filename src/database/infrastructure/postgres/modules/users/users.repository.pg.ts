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

import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { HashedPassword } from 'src/users/domain/value-objects/user.hashed-password';
import { UserType } from 'src/users/domain/value-objects/user.type';
import { UserSubscriptionStatus } from 'src/users/domain/value-objects/user.user-subscription-status';
import { UserPreferences } from 'src/users/domain/value-objects/user.user-preferences';
import { UserState } from 'src/users/domain/value-objects/user.state';
import { UserRole } from 'src/users/domain/value-objects/user.roles';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';

import { UserEntity } from '../../entities/users.entity';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from '../../../catalogs/repository.catalog.enum';
import { PostgresErrorMapper } from '../../errors/pg-error.mapper';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

import { UserFavorites } from 'src/users/domain/value-objects/user.favorite-kahoots'; 

@RepositoryPostgres(RepositoryName.User)
@Injectable()
export class UserRepositoryPostgres implements IUserRepository {
  private readonly errorMapper = new PostgresErrorMapper();

  constructor(
    @InjectRepository(UserEntity)
    private readonly userModel: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<void> {
    const context: IDatabaseErrorContext = { 
        layer: 'INFRASTRUCTURE', 
        method: 'save', 
        target: 'User',
        databaseType: 'postgresql',
        adapterName: UserRepositoryPostgres.name,
        portName: 'IUserRepository'
    };

    try {
      const entity = new UserEntity();
      entity.id = user.id.value;
      entity.email = user.email.value;
      entity.username = user.username.value;
      entity.passwordHash = user.passwordHash.value;
      
      entity.profileName = user.userProfileDetails.name;
      entity.profileDescription = user.userProfileDetails.description;
      entity.avatarAssetId = user.userProfileDetails.avatarAssetId;

      entity.type = user.type;
      entity.state = user.state;
      entity.isDeleted = user.isDeleted;
      
      entity.lastUsernameUpdate = user.lastUsernameUpdate?.value || null;

      entity.subscription = {
          state: user.subscriptionStatus.state,
          plan: user.subscriptionStatus.plan,
          expiresAt: user.subscriptionStatus.expiresAt.value
      };
      
      entity.preferences = {
          theme: user.userPreferences.themePreference
      };
      
      entity.roles = user.roles;
      entity.favorites = user.favorites.toPrimitives();

      await this.userModel.save(entity);

    } catch (error) {
       throw this.errorMapper.toErrorData(error, context);
    }
  }

  async findById(id: UserId): Promise<Optional<User>> {
    try {
      const entity = await this.userModel.findOne({ where: { id: id.value } });
      return entity ? new Optional(this.toDomain(entity)) : new Optional();
    } catch (error) {
      throw new Error(`[Postgres] Error finding user by ID: ${error.message}`);
    }
  }

  async findByEmail(email: UserEmail): Promise<Optional<User>> {
    try {
      const entity = await this.userModel.findOne({ where: { email: email.value } });
      return entity ? new Optional(this.toDomain(entity)) : new Optional();
    } catch (error) {
      throw new Error(`[Postgres] Error finding user by Email: ${error.message}`);
    }
  }

  async findByUsername(username: UserName): Promise<Optional<User>> {
    try {
      const entity = await this.userModel.findOne({ where: { username: username.value } });
      return entity ? new Optional(this.toDomain(entity)) : new Optional();
    } catch (error) {
      throw new Error(`[Postgres] Error finding user by Username: ${error.message}`);
    }
  }

  async existsUserByEmail(email: UserEmail): Promise<boolean> {
    const count = await this.userModel.createQueryBuilder('u')
        .where('u.email = :email', { email: email.value })
        .getCount();
        
    return count > 0;
  }

  async existsUserByUsername(username: UserName): Promise<boolean> {
    const count = await this.userModel.createQueryBuilder('u')
        .where('u.username = :username', { username: username.value })
        .getCount();

    return count > 0;
  }

  async findAll(): Promise<User[]> {
      const entities = await this.userModel.find();
      return entities.map(e => this.toDomain(e));
  }

  async deleteUser(id: UserId): Promise<void> {
    await this.userModel.delete({ id: id.value });
  }

  private toDomain(entity: UserEntity): User {
      return User.reconstitute(
          {
              email: new UserEmail(entity.email),
              username: new UserName(entity.username),
              passwordHash: new HashedPassword(entity.passwordHash),
              userProfileDetails: new UserProfileDetails(
                  entity.profileName,
                  entity.profileDescription,
                  entity.avatarAssetId
              ),
              type: entity.type as UserType, 
              state: entity.state as UserState,
              isDeleted: entity.isDeleted,
              deletedHash: null,
              roles: entity.roles as UserRole[],
              
              userPreferences: UserPreferences.create(entity.preferences.theme),
              
              subscriptionStatus: new UserSubscriptionStatus(
                  entity.subscription.state as any,
                  entity.subscription.plan as any,
                  DateISO.createFrom(entity.subscription.expiresAt)
              ),
              
              favorites: UserFavorites.fromPrimitives(entity.favorites), 

              lastUsernameUpdate: entity.lastUsernameUpdate 
                ? DateISO.createFrom(entity.lastUsernameUpdate) 
                : undefined
          },
          new UserId(entity.id)
      );
  }
}