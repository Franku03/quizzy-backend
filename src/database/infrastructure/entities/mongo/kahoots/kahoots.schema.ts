import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'kahoots',
})
export class KahootMongo extends Document {
  @Prop({
    unique: true,
    index: true,
  })
  public name: string;
}

export const KahootSchema = SchemaFactory.createForClass(KahootMongo);
