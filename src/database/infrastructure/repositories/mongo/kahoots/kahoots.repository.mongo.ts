import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IKahootRepository } from 'src/database/domain/repositories/kahoot/IKahootRepository';
import { KahootMongo } from 'src/database/infrastructure/entities/mongo/kahoots/kahoots.schema';

@Injectable()
export class KahootRepositoryMongo implements IKahootRepository {
  constructor(
    @InjectModel(KahootMongo.name)
    private readonly userModel: Model<KahootMongo>,
  ) {}

  async saveKahoot(name: string): Promise<void> {
    await this.userModel.create({ name: name });
  }
}
