/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\commands\update-profile\update-profile.command.ts

import { ICommand } from 'src/core/application/cqrs/command.interface';

interface UpdateProfileProps {
  userId: string;         // El ID del autor (del token)
  targetUserId: string;   // El ID del perfil a modificar
  name?: string;
  description?: string;
  avatarAssetId?: string;
  themePreference?: string;
  username?: string;
  email?: string;
  newPassword?: string;
  currentPassword?: string;
}

export class UpdateProfileCommand implements ICommand {
  public readonly userId: string;
  public readonly targetUserId: string;
  public readonly name?: string;
  public readonly description?: string;
  public readonly avatarAssetId?: string;
  public readonly themePreference?: string;
  public readonly username?: string;
  public readonly email?: string;
  public readonly newPassword?: string;
  public readonly currentPassword?: string;

  constructor(props: UpdateProfileProps) {
    Object.assign(this, props); // Mismo patrón que BaseKahootCommand
  }
}