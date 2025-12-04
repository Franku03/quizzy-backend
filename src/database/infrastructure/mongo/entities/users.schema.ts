import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { UserType } from 'src/users/domain/value-objects/user.type';
import { SubscriptionState } from 'src/users/domain/value-objects/user.subscription-state';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';
import { UIThemeEnum } from 'src/users/domain/value-objects/user.user-preferences';

@Schema({ _id: false })
class UserProfileSchema {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: String, required: true })
    avatarUrl: string;
}

@Schema({ _id: false })
class SubscriptionSchema {
    @Prop({ type: String, enum: SubscriptionState, required: true })
    state: string;

    @Prop({ type: String, enum: SubscriptionPlan, required: true })
    plan: string;

    @Prop({ type: Date, required: true })
    expiresAt: Date;
}

@Schema({ _id: false })
class PreferencesSchema {
    @Prop({ type: String, enum: UIThemeEnum, default: UIThemeEnum.LIGHT })
    theme: string;
}


@Schema({
    collection: 'users',
    timestamps: false,
    strict: false
})
export class UserMongo extends Document {

    @Prop({
        type: String,
        unique: true,
        index: true,
        required: true,
    })
    public userId: string; 

    @Prop({
        type: String,
        unique: true,
        index: true,
        required: true,
    })
    public email: string;

    @Prop({
        type: String,
        unique: true,
        required: true,
    })
    public username: string;

    @Prop({
        type: String,
        required: true,
    })
    public passwordHash: string;

    @Prop({
        type: String,
        enum: UserType,
        default: UserType.STUDENT,
        required: true,
    })
    public type: string;

    @Prop({
        type: Date,
        required: false,
    })
    public lastUsernameUpdate?: Date;

    @Prop({ type: UserProfileSchema, required: true })
    public profile: UserProfileSchema;

    @Prop({ type: SubscriptionSchema, required: true })
    public subscription: SubscriptionSchema;

    @Prop({ type: PreferencesSchema, required: true })
    public preferences: PreferencesSchema;
}

export const UserSchema = SchemaFactory.createForClass(UserMongo);