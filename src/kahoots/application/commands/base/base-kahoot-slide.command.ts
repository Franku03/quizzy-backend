/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\base\base-kahoot-slide.command.ts

import { KahootOptionCommand } from './base-kahoot-option.command';

// Interfaz que define la estructura del objeto de propiedades
interface SlideCommandProps {
  id?: string;
  // Propiedades que el Command requiere
  position: number;
  slideType: string;
  timeLimit: number;

  // Propiedades opcionales
  question?: string;
  slideImage?: string;
  points?: number;
  description?: string;
  options?: KahootOptionCommand[];
}

export class KahootSlideCommand {
  public readonly id?: string;

  public readonly position!: number;
  public readonly slideType!: string;
  public readonly timeLimit!: number;

  public readonly question?: string;
  public readonly slideImage?: string;
  public readonly points?: number;
  public readonly description?: string;
  public readonly options?: KahootOptionCommand[];

  constructor(props: SlideCommandProps) {
    // Asigna todas las propiedades del objeto de configuración a la instancia
    Object.assign(this, props);
  }
}
