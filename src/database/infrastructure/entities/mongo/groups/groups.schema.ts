import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema({ _id: false }) 
class MemberSchema {
    @Prop() id: string;
    @Prop() userId: string;
    @Prop() role: string;
    @Prop() joinedAt: Date;
}

@Schema({ _id: false })
class AssignmentSchema {
    @Prop() id: string;
    @Prop() quizId: string;
    @Prop() assignedBy: string;
    @Prop() availableFrom: Date;
    @Prop() availableUntil: Date;
    @Prop() isAssignmentCompleted: boolean;
}

@Schema({ _id: false })
class CompletionSchema {
    @Prop() userId: string;
    @Prop() quizId: string;
    @Prop() attemptId: string;
    @Prop() score: number;
}

@Schema({ _id: false })
class TokenSchema {
    @Prop() value: string;
    @Prop() expiresAt: Date;
}

// Principal schema para el agregado de grupo
@Schema({
    collection: 'groups',
    strict: false,
    timestamps: false 
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


    @Prop({ required: false })
    public description?: string;

    @Prop({ required: false, default: Date.now }) 
    public createdAt: Date;

    @Prop({ type: [MemberSchema], default: [] })
    public members: MemberSchema[];

    @Prop({ type: [AssignmentSchema], default: [] })
    public assignments: AssignmentSchema[];

    @Prop({ type: [CompletionSchema], default: [] })
    public completions: CompletionSchema[];

    @Prop({ type: TokenSchema, required: false })
    public invitationToken?: TokenSchema;
}

export const GroupSchema = SchemaFactory.createForClass(GroupMongo);