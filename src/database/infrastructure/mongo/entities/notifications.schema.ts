/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\entities\notifications.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbMongoDocument } from '../decorators/db-mongo-document.decorator';
import { DbMongoSchema } from '../decorators/db-mongo-schema.decorator';

const COLLECTION_NAME: string = 'notifications'
@DbMongoDocument(COLLECTION_NAME)
@Schema({ collection: COLLECTION_NAME, timestamps: true })
export class NotificationMongo extends Document {

    @Prop({
        type: String,
        unique: true,
        index: true,
        required: true,
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

    @Prop({ required: false })
    resourceId?: string;

    @Prop({ default: false })
    isRead: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(NotificationMongo);

NotificationSchema.set('id', false);

DbMongoSchema(COLLECTION_NAME)(NotificationSchema);    