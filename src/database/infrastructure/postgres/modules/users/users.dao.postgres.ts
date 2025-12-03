import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IUserDao } from 'src/users/application/queries/ports/users.dao.port';
import { UserEntity } from '../../entities/users.entity';
import { Repository } from 'typeorm';
import { Optional } from 'src/core/types/optional';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';

@Injectable()
export class UserDaoPostgres implements IUserDao {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getUserByName(name: string): Promise<Optional<UserReadModel>> {
    const user = await this.userRepo.findOne({ where: { name } });
    if (!user) return new Optional<UserReadModel>();

    return new Optional<UserReadModel>(new UserReadModel(user.name));
  }
}
