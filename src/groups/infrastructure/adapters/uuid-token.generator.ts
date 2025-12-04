import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ITokenGenerator } from '../../domain/domain-services/i.token-generator.service.interface';

@Injectable()
export class UuidTokenGenerator implements ITokenGenerator {
    generate(): string {
        return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
    }
}