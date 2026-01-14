import { ValueObject } from 'src/core/domain/abstractions/value.object';
import { Either } from '../../../core/types/either';
import { ErrorData } from 'src/core/types';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

interface FiltersProps {
  readonly sendToAdmins: boolean;
  readonly sendToRegularUsers: boolean;
}

export class Filters extends ValueObject<FiltersProps> {
  private constructor(
    private readonly sendToAdmins: boolean,
    private readonly sendToRegularUsers: boolean,
  ) {
    super({ sendToAdmins, sendToRegularUsers });
  }

  public static create(
    sendToAdmin?: boolean,
    sendToRegularUsers?: boolean,
  ): Either<ErrorData, Filters> {
    const context = createDomainContext('Filters', 'validateFilters', {
      domainObjectKind: 'ValueObject',
    });

    if (!(!!sendToAdmin || !!sendToRegularUsers)) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { generic: ['INVALID_DATA'] },
          'message cannot have toAdmins and toRegularUsers filter false at the same time.',
        ),
      );
    }

    return Either.makeRight(new Filters(!!sendToAdmin, !!sendToRegularUsers));
  }

  getSendToAdmins(): boolean {
    return this.sendToAdmins;
  }

  getSendToRegularUsers(): boolean {
    return this.sendToRegularUsers;
  }

  setSendToAdmins(sendToAdmins: boolean): Either<ErrorData, Filters> {
    return Filters.create(sendToAdmins, this.sendToRegularUsers);
  }

  setSendToRegularUsers(
    sendToRegularUsers: boolean,
  ): Either<ErrorData, Filters> {
    return Filters.create(this.sendToAdmins, sendToRegularUsers);
  }
}
