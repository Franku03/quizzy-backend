import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';
import { MassMessageId } from '../../../core/domain/shared-value-objects/id-objects/mass-message.id';
import { MessageContent } from '../value-objects/message.content';
import { Filters } from '../value-objects/filters';
import { AggregateRoot } from 'src/core/domain/abstractions/aggregate.root';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { Either, ErrorData } from 'src/core/types';
import { IVerifyIfUserIsAdminService } from '../domain-services/verify-if-user-is-admin.service.interface';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { ISendNotificationService } from '../domain-services/send-notification.service.interface';

export interface MassMessageProps {
  massMessageId: MassMessageId;
  author: UserId;
  content: MessageContent;
  filter: Filters;
  createdAt: DateISO;
}

export class MassMessage extends AggregateRoot<
  MassMessageProps,
  MassMessageId
> {
  protected checkInvariants(): void {
    throw new Error('Method not implemented.');
  }

  private constructor(props: MassMessageProps, id: MassMessageId) {
    super(props, id);
  }

  // --- Factory Method ---
  public static async create(
    props: MassMessageProps,
    id: MassMessageId,
    verifyAdminService: IVerifyIfUserIsAdminService,
  ): Promise<Either<ErrorData, MassMessage>> {
    const domainContext = createDomainContext(
      'MassMessage',
      'createAggregate',
      {
        domainObjectKind: 'AggregateRoot',
      },
    );

    const userIsAdminEither = await verifyAdminService.execute(props.author);

    if (userIsAdminEither.isLeft()) {
      return Either.makeLeft(userIsAdminEither.getLeft());
    }

    const userIsAdmin = userIsAdminEither.getRight();

    if (!userIsAdmin) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          domainContext,
          { generic: ['UNAUTHORIZED'] },
          'User must be admin to be able to send mass notifications',
        ),
      );
    }

    return Either.makeRight(new MassMessage(props, id));
  }

  public async send(
    sendNotificationService: ISendNotificationService,
  ): Promise<Either<ErrorData, void>> {
    return await sendNotificationService.execute(this);
  }

  // --- Getters ---
  public get massMessageId(): MassMessageId {
    return this.properties.massMessageId;
  }

  public get authorId(): UserId {
    return this.properties.author;
  }

  public get createdAt(): DateISO {
    return this.properties.createdAt;
  }

  public get filter(): Filters {
    return this.properties.filter;
  }

  public get content(): MessageContent {
    return this.properties.content;
  }

  // --- Métodos para acceder a los datos del contenido ---

  /**
   * Obtiene el título del mensaje
   */
  public getTitle(): string {
    return this.properties.content.gettitle();
  }

  /**
   * Obtiene el cuerpo del mensaje
   */
  public getMessage(): string {
    return this.properties.content.getmessage();
  }

  /**
   * Obtiene los datos del filtro
   */
  public getFilterSendToAdmins(): boolean {
    return this.properties.filter.getSendToAdmins();
  }

  public getFilterSendToRegularUsers(): boolean {
    return this.properties.filter.getSendToRegularUsers();
  }

  /**
   * Método para obtener un snapshot del mensaje (útil para persistencia)
   */
  public getSnapshot(): {
    massMessageId: string;
    authorId: string;
    title: string;
    message: string;
    sendToAdmins: boolean;
    sendToRegularUsers: boolean;
    createdAt: string;
  } {
    return {
      massMessageId: this.massMessageId.value,
      authorId: this.authorId.value,
      title: this.getTitle(),
      message: this.getMessage(),
      sendToAdmins: this.getFilterSendToAdmins(),
      sendToRegularUsers: this.getFilterSendToRegularUsers(),
      createdAt: this.createdAt.value,
    };
  }
}
