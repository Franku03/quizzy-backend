/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\shared-value-objects\parameter-objects\parameter.object.result.ts

import { Optional } from 'src/core/types/optional';
import { Submission } from './parameter.object.submission';
import { ValueObject } from '../../abstractions/value.object';
import { Score } from '../value-objects/value.object.score';
import { SlideId } from '../id-objects/kahoot.slide.id';

interface ResultProps {
  readonly submission: Submission;
  readonly score: Optional<Score>;
  readonly isAnswerCorrect: boolean;
}

export class Result extends ValueObject<ResultProps> {
  public constructor(
    submission: Submission,
    score: Optional<Score>,
    isAnswerCorrect: boolean,
  ) {
    if (!submission) {
      throw new Error(
        'El resultado debe estar asociado a una submission válida.',
      );
    }

    super({ submission, score, isAnswerCorrect });
  }

  public getScore(): Optional<Score> {
    return this.properties.score;
  }

  public getScoreValue(): number {
    if (this.properties.score.hasValue()) {
      return this.properties.score.getValue().getScore();
    }
    return 0;
  }

  public isCorrect(): boolean {
    return this.properties.isAnswerCorrect;
  }

  public getSubmission(): Submission {
    return this.properties.submission;
  }

  public getSlideId(): SlideId {
    return this.properties.submission.getSlideId();
  }
}
