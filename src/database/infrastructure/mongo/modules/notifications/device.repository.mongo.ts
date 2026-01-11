import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IDeviceRepository } from 'src/notifications/domain/ports/device.repository.port';
import { DeviceTokenMongo } from '../../entities/devices.schema';

@Injectable()
export class MongoDeviceRepository implements IDeviceRepository {
    constructor(@InjectModel(DeviceTokenMongo.name) private readonly model: Model<DeviceTokenMongo>) { }

    async register(userId: string, token: string, deviceType: string): Promise<void> {
        await this.model.updateOne(
            { userId, token },
            { $set: { userId, token, deviceType, updatedAt: new Date() } },
            { upsert: true }
        ).exec();
    }

    async remove(userId: string, token: string): Promise<void> {
        await this.model.deleteOne({ userId, token }).exec();
    }

    async findTokensByUserId(userId: string): Promise<string[]> {
        const docs = await this.model.find({ userId }).select('token').exec();
        return docs.map(doc => doc.token);
    }
}