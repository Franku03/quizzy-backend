/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\entities\users.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { UserType } from 'src/users/domain/value-objects/user.type';
import { SubscriptionState } from 'src/users/domain/value-objects/user.subscription-state';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';
import { UIThemeEnum } from 'src/users/domain/value-objects/user.user-preferences';
import { DbMongoDocument } from '../decorators/db-mongo-document.decorator';
import { DbMongoSchema } from '../decorators/db-mongo-schema.decorator';
import { UserState } from 'src/users/domain/value-objects/user.state';
import { UserRole } from 'src/users/domain/value-objects/user.roles';

const COLLECTION_NAME: string = 'users';

@Schema({ _id: false })
class UserProfileSchema {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: false })
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

@DbMongoDocument(COLLECTION_NAME)
@Schema({ collection: COLLECTION_NAME, timestamps: true })
export class UserMongo extends Document {
  @Prop({ type: String, unique: true, index: true, required: true })
  public userId: string;

  @Prop({ type: String, unique: true, index: true, required: true })
  public email: string;

  @Prop({ type: String, unique: true, required: true })
  public username: string;

  @Prop({ type: String, required: true })
  public passwordHash: string;

  @Prop({
    type: String,
    enum: UserType,
    default: UserType.STUDENT,
    required: true,
  })
  public type: string;

  @Prop({ type: Date, required: false })
  public lastUsernameUpdate?: Date;

  @Prop({ type: UserProfileSchema, required: true })
  public profile: UserProfileSchema;

  @Prop({ type: SubscriptionSchema, required: true })
  public subscription: SubscriptionSchema;

  @Prop({ type: PreferencesSchema, required: true })
  public preferences: PreferencesSchema;

  @Prop({ type: [String], default: [] })
  public favoriteKahoots: string[];

  @Prop({
    type: String,
    enum: UserState,
    default: UserState.ACTIVE, // Cambiado de isBlocked
    required: true,
  })
  public state: string;

  @Prop({
    type: [String],
    enum: UserRole,
    default: [UserRole.USER], // Cambiado de isAdmin
    required: true,
  })
  public roles: string[];

  @Prop({ type: Boolean, default: false })
  public isDeleted: boolean;

  @Prop({ type: String, required: false, default: null })
  public deletedHash: string | null;
}

export const UserSchema = SchemaFactory.createForClass(UserMongo);

DbMongoSchema(COLLECTION_NAME)(UserSchema);
