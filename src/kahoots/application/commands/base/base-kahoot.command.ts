/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\base\base-kahoot.command.ts

import { KahootSlideCommand } from './base-kahoot-slide.command';
import { ICommand } from 'src/core/application/cqrs/command.interface';

// Interfaz que define la estructura del objeto de propiedades
interface BaseCommandProps {
  title?: string;
  description?: string;
  imageId?: string;
  themeId: string;
  category?: string;
  visibility: string;
  status: string;
  slides?: KahootSlideCommand[];
  userId: string;
}

export class BaseKahootCommand implements ICommand {
  public readonly title?: string;
  public readonly userId: string;
  public readonly description?: string;
  public readonly imageId?: string;
  public readonly themeId: string;
  public readonly category?: string;
  public readonly visibility: string;
  public readonly status: string;
  public readonly slides?: KahootSlideCommand[];

  constructor(props: BaseCommandProps) {
    Object.assign(this, props);
  }
}
