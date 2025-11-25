import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IKahootRepository } from 'src/database/domain/repositories/kahoot/IKahootRepository';
import { KahootEntity } from 'src/database/infrastructure/entities/postgres/kahoots/kahoots.entity';

@Injectable()
export class KahootRepositoryPostgres implements IKahootRepository {
  constructor(
    @InjectRepository(KahootEntity)
    private readonly repo: Repository<KahootEntity>,
  ) {}

  async saveKahoot(name: string): Promise<void> {
    const user = this.repo.create({ name });
    await this.repo.save(user);
  }
}
