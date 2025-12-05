import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUuidGenerationService } from '../../domain/domain-services/i.uuid-generator.interface';

@Injectable()
export class UuidGeneratorService implements IUuidGenerationService {
  
  generateIUserId(): string {
    return randomUUID();
  }
}