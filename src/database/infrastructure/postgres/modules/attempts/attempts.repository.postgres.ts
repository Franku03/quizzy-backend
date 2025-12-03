import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttemptEntity } from '../../entities/attempt.entity';
import { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';

@Injectable()
export class SoloAttemptRepositoryPostgres /*implements SoloAttemptRepository*/ {
  constructor(
    @InjectRepository(AttemptEntity)
    private readonly repo: Repository<AttemptEntity>,
  ) {}

  /*async saveKahoot(name: string): Promise<void> {
    const user = this.repo.create({ name });
    await this.repo.save(user);
  }*/
}
