/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\shared-value-objects\value-objects\value.object.response-time.ts

import { ValueObject } from 'src/core/domain/abstractions/value.object';

interface ResponseTimeProps {
  readonly valueInSeconds: number;
}

export class ResponseTime extends ValueObject<ResponseTimeProps> {
  public constructor(valueInSeconds: number) {
    if (valueInSeconds < 0) {
      throw new Error('El tiempo debe ser un número finito no negativo.');
    }
    super({ valueInSeconds });
  }
  public static fromSeconds(seconds: number): ResponseTime {
    return new ResponseTime(seconds);
  }

  public static fromMinutes(minutes: number): ResponseTime {
    const seconds = minutes * 60;
    return new ResponseTime(seconds);
  }

  public static fromMilliseconds(milliseconds: number): ResponseTime {
    const seconds = milliseconds / 1000;
    return new ResponseTime(seconds);
  }
  public toSeconds(): number {
    return this.properties.valueInSeconds;
  }

  public toMilliseconds(): number {
    return this.properties.valueInSeconds * 1000;
  }
}
