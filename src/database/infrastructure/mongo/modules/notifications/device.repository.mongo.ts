// src/database/infrastructure/mongo/modules/notifications/device.repository.mongo.ts
// src/database/infrastructure/mongo/modules/notifications/device.repository.mongo.ts

import { Injectable, Inject } from '@nestjs/common';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IDeviceRepository } from 'src/notifications/domain/ports/device.repository.port';
import { DeviceTokenMongo } from '../../entities/devices.schema';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';
import { RepositoryMongo } from '../../decorators/repository-mongo.decorator';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@RepositoryMongo(RepositoryName.Device)
@Injectable()
export class MongoDeviceRepository implements IDeviceRepository {
    constructor(
        @InjectModel(DeviceTokenMongo.name) private readonly model: Model<DeviceTokenMongo>,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR)
        private readonly idGenerator: IdGenerator<string>,
    ) { }

    async register(userId: string, token: string, deviceType: string): Promise<void> {
        const existingDevice = await this.model.findOne({ userId, token }).exec();

        if (existingDevice) {
            await this.model.updateOne(
                { userId, token },
                { $set: { deviceType, updatedAt: new Date() } }
            ).exec();
        } else {
            const deviceId = await this.idGenerator.generateId();
            await this.model.create({
                deviceId,
                userId,
                token,
                deviceType,
                updatedAt: new Date(),
            });
        }
    }

    async remove(userId: string, token: string): Promise<void> {
        await this.model.deleteOne({ userId, token }).exec();
    }

    async findTokensByUserId(userId: string): Promise<string[]> {
        const docs = await this.model.find({ userId }).select('token').exec();
        return docs.map(doc => doc.token);
    }
}