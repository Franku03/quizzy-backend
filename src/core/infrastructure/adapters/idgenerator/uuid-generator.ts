import { Injectable } from '@nestjs/common'
import { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class UuidGenerator implements IdGenerator<string> {
    generateId(): string {
        return uuidv4()
    }
}