import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from '../../../catalogs/dao.catalog.enum';
import { UserEntity } from '../../entities/users.entity';

import { IUserDao } from 'src/users/application/queries/ports/users.dao.port';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';
import { Optional } from 'src/core/types/optional';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { UserReadPgMapper } from './mappers/user.read.pg.mapper';

@DaoPostgres(DaoName.User)
@Injectable()
export class UserDao implements IUserDao {
  private readonly contextBase = 'USER_POSTGRES_BASE';

  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    
    @Inject(APPLICATION_CORE_TOKENS.MAPPER.USER_PG_READ)
    private readonly mapper: UserReadPgMapper 
  ) {}

  async getUserByName(username: string): Promise<Optional<UserReadModel>> {
    try {
        const entity = await this.repository.findOne({ where: { username } });
        
        if (!entity) return new Optional();

        const readModel = this.mapper.map(entity);
        
        return new Optional(readModel);
    } catch (error) {
        throw new Error(`[UserDao Postgres] Error getting user by name: ${error.message}`);
    }
  }

  async getUserById(id: string): Promise<Optional<UserReadModel>> {
    try {
        const entity = await this.repository.findOne({ where: { id } });

        if (!entity) return new Optional();

        const readModel = this.mapper.map(entity);

        return new Optional(readModel);
    } catch (error) {
        throw new Error(`[UserDao Postgres] Error getting user by ID: ${error.message}`);
    }
  }
}