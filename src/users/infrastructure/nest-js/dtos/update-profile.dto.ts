/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\infrastructure\nest-js\dtos\update-profile.dto.ts

import { IsOptional, IsString, Length, IsEnum, IsEmail, MinLength, ValidateIf } from 'class-validator';
import { Match } from '../decorators/match.decorator';
import { UIThemeEnum } from 'src/users/domain/value-objects/user.user-preferences';

export class UpdateProfileDto {
    @IsOptional()
    @IsString( { message: 'The username must be text.' })
    @Length(6, 20, { message: 'The username must be between 6 and 20 characters long.' })
    username?: string;
  
    @IsOptional()
    @IsEmail( {}, { message: 'The email must be a valid email address.' })
    email?: string;
    
      @ValidateIf(o => o.newPassword) 
      @IsString( { message: 'The current password must be text.' })
      @MinLength(6, { message: 'The current password must be at least 6 characters long.' })
      currentPassword?: string;
    
    @IsOptional()
    @IsString( { message: 'The new password must be text.' })
    @MinLength(6, { message: 'The new password must be at least 6 characters long.' })
    @Match('confirmNewPassword', { message: 'Passwords do not match.' })
    newPassword?: string;

    @ValidateIf(o => o.newPassword)
    @IsString( { message: 'The confirm new password must be text.' })
    confirmNewPassword?: string;

  @IsOptional()
  @IsString({ message: 'The name must be text.' })
  @Length(1, 148, { message: 'The name must be between 1 and 148 characters long.' })
  name?: string;

  @IsOptional()
  @IsString( { message: 'The description must be text.' })
  @Length(0, 300, { message: 'The description cannot be longer than 300 characters.' })
  description?: string;

  @IsOptional()
  @IsString( { message: 'The avatarAssetId must be text.' })
  avatarAssetId?: string;

  @IsOptional()
  @IsEnum(UIThemeEnum, { message: 'The theme preference must be a valid option ("LIGHT" or "DARK").' })
  themePreference?: UIThemeEnum;
}