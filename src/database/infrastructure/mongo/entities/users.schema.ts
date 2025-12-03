import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'users',
})
export class UserMongo extends Document {
  @Prop({
    unique: true,
    index: true,
  })
  public name: string;
}

export const UserSchema = SchemaFactory.createForClass(UserMongo);
