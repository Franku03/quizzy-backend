import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KahootEntity } from 'src/database/infrastructure/postgres/entities/kahoots.entity';
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';

@Injectable()
export class KahootRepositoryPostgres /*implements IKahootRepository*/ {
  constructor(
    @InjectRepository(KahootEntity)
    private readonly repo: Repository<KahootEntity>,
  ) {}

  /*async saveKahoot(name: string): Promise<void> {
    const user = this.repo.create({ name });
    await this.repo.save(user);
  }*/
}
