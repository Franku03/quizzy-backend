/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\base\base-kahoot-option.command.ts

interface OptionCommandProps {
  // text: Mapeado de text. Aunque puede ser "", el Command lo requiere.
  text: string;
  // optionImage: Opcional, ya purgado a undefined.
  optionImage?: string;
  // isCorrect: Obligatorio y siempre debe ser un booleano.
  isCorrect: boolean;
}

export class KahootOptionCommand {
  public readonly text: string;
  public readonly isCorrect: boolean;
  public readonly optionImage?: string;

  constructor(props: OptionCommandProps) {
    Object.assign(this, props);
  }
}
