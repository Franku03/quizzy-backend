import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbMongoDocument } from '../decorators/db-mongo-document.decorator';
import { DbMongoSchema } from '../decorators/db-mongo-schema.decorator';

const COLLECTION_NAME = 'mass_notifications';

@Schema({ _id: false })
class FiltersSchema {
  @Prop({ type: Boolean, required: true })
  sendToAdmins: boolean;

  @Prop({ type: Boolean, required: true })
  sendToRegularUsers: boolean;
}

@Schema({ _id: false })
class MessageContentSchema {
  @Prop({ type: String, required: true, minlength: 3, maxlength: 100 })
  title: string;

  @Prop({ type: String, required: true, minlength: 3, maxlength: 900 })
  message: string;
}

@DbMongoDocument(COLLECTION_NAME)
@Schema({ collection: COLLECTION_NAME, timestamps: true })
export class MassNotificationMongo extends Document {
  @Prop({ type: String, unique: true, index: true, required: true })
  public massMessageId: string;

  @Prop({ type: String, required: true, index: true })
  public authorId: string;

  @Prop({ type: MessageContentSchema, required: true })
  public content: MessageContentSchema;

  @Prop({ type: FiltersSchema, required: true })
  public filter: FiltersSchema;

  @Prop({ type: Date, required: true })
  public createdAt: Date;
}

export const MassNotificationSchema = SchemaFactory.createForClass(
  MassNotificationMongo,
);

DbMongoSchema(COLLECTION_NAME)(MassNotificationSchema);

// Interface para documentos lean
export interface IMassNotificationDocument {
  massMessageId: string;
  authorId: string;
  content: {
    title: string;
    message: string;
  };
  filter: {
    sendToAdmins: boolean;
    sendToRegularUsers: boolean;
  };
  createdAt: Date;
  updatedAt?: Date;
}
