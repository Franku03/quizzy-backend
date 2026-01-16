import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { UpgradeToPremiumHandler } from 'src/subscription/application/commands/upgrade-to-premium/upgrade-to-premium.handler';
import { UpgradeToPremiumCommand } from 'src/subscription/application/commands/upgrade-to-premium/upgrade-to-premium.command';
import { UserMother } from 'test/users/object-mothers/domain/aggregate/user.mother';
import { User } from 'src/users/domain/aggregates/user';
import { Optional } from 'src/core/types/optional';
import { SubscriptionReadModel } from 'src/subscription/application/queries/read-models/subscription.read.model';
import { ErrorData } from 'src/core/types';

export class SubscriptionTestingAPI {
  private repoMock: jest.Mocked<IUserRepository>;
  private loggerMock: jest.Mocked<ILogger>;

  private handler: UpgradeToPremiumHandler;

  private lastResult: SubscriptionReadModel | null = null;
  private lastError: ErrorData | null = null;
  private savedUser: User | null = null;

  constructor() {
    this.repoMock = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    this.loggerMock = {
        log: jest.fn(),
        error: jest.fn(),
        errorResult: jest.fn(),
      } as unknown as jest.Mocked<ILogger>;

    this.handler = new UpgradeToPremiumHandler(this.repoMock, this.loggerMock);
  }

  // === GIVEN (Configuración del Escenario) ===
  
  public givenAFreeUserExists(userId: string): this {
    const user = UserMother.createFreeUser(userId);
    this.repoMock.findById.mockResolvedValue(new Optional(user));
    return this;
  }

  public givenUserDoesNotExist(): this {
    this.repoMock.findById.mockResolvedValue(new Optional());
    return this;
  }

  // === WHEN (Ejecución de la Acción) ===

  public async whenUpgradeToPremiumIsExecuted(userId: string): Promise<this> {
    const command = new UpgradeToPremiumCommand(userId);
    const result = await this.handler.execute(command);

    if (result.isRight()) {
      this.lastResult = result.getRight();
      this.lastError = null;
    } else {
      this.lastError = result.getLeft();
      this.lastResult = null;
    }

    if (this.repoMock.save.mock.calls.length > 0) {
        this.savedUser = this.repoMock.save.mock.calls[0][0];
    }

    return this;
  }

  // === THEN (Verificaciones / Aserciones) ===

  public thenSubscriptionShouldBePremium(): void {
    expect(this.lastResult).toBeDefined();
    expect(this.lastResult!.plan).toBe('PREMIUM');
    expect(this.lastResult!.expiresAt).toContain('-');

    expect(this.repoMock.save).toHaveBeenCalledTimes(1);
    expect(this.savedUser).toBeDefined();
    expect(this.savedUser!.subscriptionStatus.isPremium()).toBe(true);
  }

  public thenItShouldFailWithUserNotFound(): void {
    expect(this.lastError).toBeDefined();
    expect(this.lastError!.code).toBe('RESOURCE_NOT_FOUND');
    this.thenRepositoryShouldNotSave();
  }

  public thenRepositoryShouldNotSave(): void {
    expect(this.repoMock.save).not.toHaveBeenCalled();
  }
};