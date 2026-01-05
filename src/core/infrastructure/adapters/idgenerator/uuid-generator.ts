import { Injectable } from '@nestjs/common'
import { IdGenerator } from 'src/core/application/idgenerator/id.generator'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class UuidGenerator implements IdGenerator<string> {
    generateId(): string {
        return uuidv4()
    }
}