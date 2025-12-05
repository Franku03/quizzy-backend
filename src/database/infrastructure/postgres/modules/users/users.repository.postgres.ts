import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';

export class UserRepositoryPostgres implements IUserRepository {
  async save(user: User): Promise<void> { throw new Error('Postgres no soportado'); }
  async findUserById(id: UserId): Promise<User | null> { throw new Error('Postgres no soportado'); }
  async findUserByEmail(email: UserEmail): Promise<User | null> { throw new Error('Postgres no soportado'); }
  async existsUserByEmail(email: UserEmail): Promise<boolean> { throw new Error('Postgres no soportado'); }
  async existsUserByUsername(username: UserName): Promise<boolean> { throw new Error('Postgres no soportado'); }
  async deleteUser(id: UserId): Promise<void> { throw new Error('Postgres no soportado'); }
}