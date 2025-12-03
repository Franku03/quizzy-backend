import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserMongo } from 'src/database/infrastructure/mongo/entities/users.schema';

@Injectable()
export class UserRepositoryMongo implements IUserRepository {
  constructor(
    @InjectModel(UserMongo.name) private readonly userModel: Model<UserMongo>,
  ) {}

  async saveUser(name: string): Promise<void> {
    await this.userModel.create({ name: name });
  }
}
