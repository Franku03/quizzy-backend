import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ICryptoService } from 'src/core/application/ports/crypto/i-crypto.service';

@Injectable()
export class NodeCryptoService implements ICryptoService {
    calculateSha256(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
}