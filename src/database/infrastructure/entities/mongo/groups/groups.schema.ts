import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
    collection: 'groups',
    strict: false, // Permite campos adicionales del objeto Group
})
export class GroupMongo extends Document {
    @Prop({
        type: String,
        unique: true,
        index: true,
        required: true,
    })
    public groupId: string;

    @Prop({
        type: String,
        index: true,
        required: true,
    })
    public adminId: string;

    @Prop({
        index: true,
        required: true,
    })
    public name: string;
}

export const GroupSchema = SchemaFactory.createForClass(GroupMongo);