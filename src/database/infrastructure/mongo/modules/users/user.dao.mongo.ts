import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IUserDao } from 'src/users/application/queries/ports/users.dao.port';
import { UserMongo } from '../../entities/users.schema';
import { Model } from 'mongoose';
import { Optional } from 'src/core/types/optional';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';

@Injectable()
export class UserDaoMongo implements IUserDao {
  constructor(
    @InjectModel(UserMongo.name)
    private readonly userModel: Model<UserMongo>,
  ) {}

  async getUserByName(name: string): Promise<Optional<UserReadModel>> {
    const user = await this.userModel.findOne({ name }).exec();
    if (!user) return new Optional<UserReadModel>();

    return new Optional<UserReadModel>(new UserReadModel(user.name));
  }
}
