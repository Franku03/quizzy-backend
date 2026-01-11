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