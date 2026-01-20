/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\create-kahoot\create-kahoot.command.ts

import { BaseKahootCommand } from '../base/base-kahoot.command';
import { KahootSlideCommand } from '../base/base-kahoot-slide.command';

/**
 * Propiedades necesarias para la creación de un Kahoot.
 * Se definen como interfaz para mantener la legibilidad en el constructor.
 */
interface CreateCommandProps {
  userId: string;
  themeId: string;
  visibility: string;
  status: string;
  title?: string;
  description?: string;
  imageId?: string;
  category?: string;
  slides?: KahootSlideCommand[];
}

export class CreateKahootCommand extends BaseKahootCommand {
  /**
   * Identificadores y estados obligatorios heredados o propios del comando.
   */
  public override readonly userId: string;
  public readonly themeId: string;
  public readonly visibility: string;
  public readonly status: string;

  /**
   * Metadatos opcionales del Kahoot.
   */
  public readonly title?: string;
  public readonly description?: string;
  public readonly imageId?: string;
  public readonly category?: string;
  public readonly slides?: KahootSlideCommand[];

  constructor(props: CreateCommandProps) {
    super(props);
    this.userId = props.userId;
    this.themeId = props.themeId;
    this.visibility = props.visibility;
    this.status = props.status;
    this.title = props.title;
    this.description = props.description;
    this.imageId = props.imageId;
    this.category = props.category;
    this.slides = props.slides;
  }
}
