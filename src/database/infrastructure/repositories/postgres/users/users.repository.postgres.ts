import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/database/infrastructure/entities/postgres/users/users.entity';
import { IUserRepository } from 'src/database/domain/repositories/users/IUserRepository';

@Injectable()
export class UserRepositoryPostgres implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async saveUser(name: string): Promise<void> {
    const user = this.repo.create({ name });
    await this.repo.save(user);
  }
}
