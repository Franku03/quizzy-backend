import { Inject, Injectable } from '@nestjs/common';
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

// Manejo de Errores
import { KAHOOT_MONGO_BASE } from '../kahoots/constants/kahoot.mongo-constants';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import { Either, ErrorData } from 'src/core/types';
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { UserRole } from 'src/users/domain/value-objects/user.roles';
import { BackOfficeUserReadModel } from 'src/backoffice/application/read-model/backoffice-user.read.model';
import { UserState } from 'src/users/domain/value-objects/user.state';

@RepositoryMongo(RepositoryName.User)
@Injectable()
export class UserRepositoryMongo implements IUserRepository {
  private readonly contextBase = KAHOOT_MONGO_BASE;
  private readonly adapterName = UserRepositoryMongo.name;
  private readonly portName = 'IUserRepository';

  /**
   * Genera el contexto usando la factory del Core.
   */
  private getCtx(
    operation: string,
    entityId?: string,
    extra?: Record<string, unknown>,
  ) {
    return createDatabaseContext(
      this.contextBase,
      this.adapterName,
      this.portName,
      operation,
      entityId,
      extra,
    );
  }

  constructor(
    @InjectModel(UserMongo.name)
    private readonly userModel: Model<UserMongo>,
    @Inject(ERROR_TOKENS.MAPPERS.MONGO)
    private readonly mongoErrorMapper: IErrorMapper<
      unknown,
      IDatabaseErrorContext
    >,
  ) {}

  // ==========================================
  // MÉTODOS EITHER PARA BACKOFFICE
  // ==========================================

  async findUserByIdEither(
    id: UserId,
  ): Promise<Either<ErrorData, User | null>> {
    const ctx = this.getCtx('findById', id.value);

    const result = await Either.tryCatch(
      // Quitamos .lean() para obtener un documento de Mongoose completo
      this.userModel.findOne({ userId: id.value }).exec(),
      (err) => this.mongoErrorMapper.toErrorData(err, ctx)
    );

    return result.chain((doc) => {
      if (!doc) return Either.makeRight(null);

      try {
        const user = UserMapper.toDomain(doc);
        return Either.makeRight(user);
      } catch (error) {
        // Crear un ErrorData usando el mongoErrorMapper
        const mappingError =
          error instanceof Error ? error : new Error('Unknown mapping error');
        const errorData = this.mongoErrorMapper.toErrorData(mappingError, {
          ...ctx,
          operation: 'mapping',
          details: 'Error mapping user document to domain',
        });
        return Either.makeLeft(errorData);
      }
    });
  }

  async saveAndGetBackofficeUserEither(
      user: User
  ): Promise<Either<ErrorData, BackOfficeUserReadModel>> {
      const ctx = this.getCtx('saveAndGetBackofficeUser', user.id.value);

      // Convertir el user de dominio a datos de persistencia
      const persistenceData = UserMapper.toPersistence(user);

      const result = await Either.tryCatch(
          // Guardamos Y obtenemos el documento actualizado en una sola operación
          this.userModel
              .findOneAndUpdate(
                  { userId: user.id.value },
                  persistenceData,
                  { 
                      upsert: true, 
                      new: true, // Devuelve el documento actualizado
                      runValidators: true 
                  }
              )
              .lean() // Obtenemos objeto plano con timestamps
              .exec(),
          (err) => this.mongoErrorMapper.toErrorData(err, ctx)
      );

      return result.chain((updatedDoc) => {
          try {
              // Mapear directamente a BackOfficeUserReadModel
              const readModel = this.mapToBackofficeReadModel(updatedDoc);
              return Either.makeRight(readModel);
          } catch (error) {
              const mappingError =
                  error instanceof Error ? error : new Error('Unknown mapping error');
              const errorData = this.mongoErrorMapper.toErrorData(mappingError, {
                  ...ctx,
                  operation: 'mapping',
                  details: 'Error mapping to backoffice read model after save',
              });
              return Either.makeLeft(errorData);
          }
      });
  }

  /**
   * Mapea un documento MongoDB directamente a BackOfficeUserReadModel
   */
  private mapToBackofficeReadModel(doc: any): BackOfficeUserReadModel {
    // Verificar si tiene los campos de timestamps de Mongoose
    const createdAt = doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString();
    const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString();
    
    // Determinar si es admin (busca el rol ADMIN en el array)
    const isAdmin = Array.isArray(doc.roles) && doc.roles.includes(UserRole.ADMIN);
    
    // Determinar el estado: "Active" o "Blocked" usando el enum UserState
    let status: string;
    if (doc.state === UserState.BLOCKED) {  // UserState.BLOCKED = 'blocked'
      status = 'Blocked';
    } else if (doc.state === UserState.ACTIVE) {  // UserState.ACTIVE = 'active'
      status = 'Active';
    } else {
      // Por si acaso hay otros estados
      status = 'Active';
    }
    
    return new BackOfficeUserReadModel(
      doc.userId,
      doc.username,
      doc.profile?.name || '',
      doc.email,
      doc.profile?.description || '',
      doc.type,
      doc.profile?.avatarUrl || null,
      createdAt,
      updatedAt,
      isAdmin,
      status
    );
  }

  // ==========================================
  // MÉTODOS LEGACY
  // ==========================================

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

  // NO usar este metodo (LEGACY). La eliminacion se maneja desde el dominio
  async deleteUser(id: UserId): Promise<void> {
    try {
      await this.userModel.deleteOne({ userId: id.value }).exec();
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
}