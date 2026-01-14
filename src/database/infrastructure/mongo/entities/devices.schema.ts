/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\entities\devices.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbMongoDocument } from '../decorators/db-mongo-document.decorator';
import { DbMongoSchema } from '../decorators/db-mongo-schema.decorator';

// Database Collection Name
const COLLECTION_NAME: string = 'notification_devices';

@DbMongoDocument(COLLECTION_NAME)
@Schema({
    collection: COLLECTION_NAME,
    strict: false,
    timestamps: false,
})
export class DeviceTokenMongo extends Document {
    @Prop({
        type: String,
        unique: true,
        index: true,
        required: true,
    })
    public deviceId: string;

    @Prop({
        type: String,
        index: true,
        required: true,
    })
    public userId: string;

    @Prop({
        type: String,
        required: true,
    })
    public token: string;

    @Prop({
        type: String
    })
    public deviceType: string;

    @Prop({ required: false, default: Date.now })
    public updatedAt: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceTokenMongo);

DeviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

DbMongoSchema(COLLECTION_NAME)(DeviceTokenSchema);