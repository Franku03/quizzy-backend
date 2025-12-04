import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/domain-services/i.password-hasher.interface';

@Injectable()
export class BcryptHasherService implements IPasswordHasher {
  
  // 10 rondas es el estándar actual de la industria (seguro y rápido)
  private readonly SALT_ROUNDS = 10;

  async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, this.SALT_ROUNDS);
  }

  async compare(plainText: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hashed);
  }
}