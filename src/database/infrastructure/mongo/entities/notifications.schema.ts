import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'notifications' })
export class NotificationMongo extends Document {


    @Prop({
        type: String,
        default: () => crypto.randomUUID(),
        alias: '_id',
    })
    public notificationId: string;

    @Prop({
        type: String,
        index: true,
        required: true,
    })
    public userId: string;

    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    body: string;

    @Prop({ default: false })
    isRead: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(NotificationMongo);

NotificationSchema.set('_id', false);
NotificationSchema.set('id', false);