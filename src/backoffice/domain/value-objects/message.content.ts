/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\domain\value-objects\message.content.ts

import { ValueObject } from 'src/core/domain/abstractions/value.object';
import { Either } from '../../../core/types/either';
import { ErrorData } from 'src/core/types';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

interface MessageContentProps {
  readonly title: string;
  readonly message: string;
}

export class MessageContent extends ValueObject<MessageContentProps> {
  private constructor(
    private readonly title: string,
    private readonly message: string,
  ) {
    super({ title, message });
  }

  public static create(
    title?: string,
    message?: string,
  ): Either<ErrorData, MessageContent> {
    const context = createDomainContext(
      'MessageContent',
      'validateMessageContent',
      {
        domainObjectKind: 'ValueObject',
      },
    );

    if (!title || !message) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { generic: ['MISSING_DATA'] },
          'title and message must be provided.',
        ),
      );
    }

    if (title.length < 3 || title.length > 100) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { generic: ['INVALID_DATA'] },
          'title must be between 3 and 100 characters',
        ),
      );
    }

    if (message.length < 3 || message.length > 900) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { generic: ['INVALID_DATA'] },
          'message must be between 3 and 900 characters',
        ),
      );
    }
    return Either.makeRight(new MessageContent(title, message));
  }

  gettitle(): string {
    return this.title;
  }

  getmessage(): string {
    return this.message;
  }

  settitle(title: string): Either<ErrorData, MessageContent> {
    return MessageContent.create(title, this.message);
  }

  setmessage(message: string): Either<ErrorData, MessageContent> {
    return MessageContent.create(this.title, message);
  }
}
