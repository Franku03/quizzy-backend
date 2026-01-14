import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { Injectable } from '@nestjs/common';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Optional } from 'src/core/types/optional'; // 👈 Agregamos el import
import { Either, ErrorData } from 'src/core/types';
import { BackOfficeUserReadModel } from 'src/backoffice/application/read-model/backoffice-user.read.model';

@RepositoryPostgres(RepositoryName.User)
@Injectable()
export class UserRepositoryPostgres implements IUserRepository {
  saveAndGetBackofficeUserEither(user: User): Promise<Either<ErrorData, BackOfficeUserReadModel>> {
      throw new Error('Method not implemented.');
  }
  findBackofficeUserByIdEither(id: UserId): Promise<Either<ErrorData, BackOfficeUserReadModel | null>> {
      throw new Error('Method not implemented.');
  }
  /*saveUserEither(user: User): Promise<Either<ErrorData, void>> {
      throw new Error('Method not implemented.');
  }*/

  findUserByIdEither(id: UserId): Promise<Either<ErrorData, User | null>> {
      throw new Error('Method not implemented.');
  }
  
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

  async existsUserByUsername(username: UserName): Promise<boolean> { 
      throw new Error('Postgres no soportado'); 
  }

  async deleteUser(id: UserId): Promise<void> { 
      throw new Error('Postgres no soportado'); 
  }
}