/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\apis\application\commands\create-group.handler.testing.api.ts

import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData, Optional } from 'src/core/types';
import { ErrorLayer } from 'src/core/errors/error.enum';

// --- Capa de Dominio ---
import { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { HashedPassword } from 'src/users/domain/value-objects/user.hashed-password';
import { UserType } from 'src/users/domain/value-objects/user.type';
import { UserSubscriptionStatus } from 'src/users/domain/value-objects/user.user-subscription-status';
import { SubscriptionState } from 'src/users/domain/value-objects/user.subscription-state';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';
import { UserPreferences } from 'src/users/domain/value-objects/user.user-preferences';
import { UserState } from 'src/users/domain/value-objects/user.state';
import { UserRole } from 'src/users/domain/value-objects/user.roles';

// --- Capa de Aplicación (SUT y Dependencias) ---
import { CreateGroupCommand } from 'src/groups/application/commands/create-group/create-group.command';
import { CreateGroupHandler } from 'src/groups/application/commands/create-group/create-group.handler';
import { CreateGroupResponse } from 'src/groups/application/commands/response-dtos/create-group.response.dto';
import { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { EventBus } from 'src/core/domain/ports/event-bus.port';

// --- Object Mothers (Datos predefinidos para pruebas) ---
import { CreateGroupCommandMother } from '../../../object-mothers/application/commands/create-group.command.mother';

/**
 * API de soporte para las pruebas unitarias del caso de uso "Crear Group".
 */
export class CreateGroupTestAPI {
  // Definición de Mocks para los puertos de los que depende el servicio de aplicación
  private repoMock: MockProxy<IGroupRepository> = mock<IGroupRepository>();
  private userRepoMock: MockProxy<IUserRepository> = mock<IUserRepository>();
  private eventBusMock: MockProxy<EventBus> = mock<EventBus>();
  private loggerMock: MockProxy<ILogger> = mock<ILogger>();

  // Estado interno para almacenar el estímulo (comando) y la respuesta del SUT
  private result?: Either<ErrorData, CreateGroupResponse>;
  private currentCommand?: CreateGroupCommand;

  constructor() {
    this.configureDefaultMocks();
  }

  /**
   * Establece una configuración base para los mocks.
   * Permite que el servicio funcione en un escenario de "éxito" por defecto.
   */
  private configureDefaultMocks(): void {
    // Configurar mocks por defecto para éxito
    this.repoMock.save.mockResolvedValue();
    this.eventBusMock.publish.mockResolvedValue();
  }

  // ============ GIVEN: Definición de Escenarios ============

  /**
   * Simula que el repositorio de infraestructura funciona correctamente.
   */
  public givenTheSystemIsReadyToStoreData(): this {
    this.repoMock.save.mockResolvedValue();
    // Mock del usuario admin existente
    const adminId = CreateGroupCommandMother.validGroup().adminId;
    const userId = new UserId(adminId);
    const email = new UserEmail('admin@test.com');
    const username = new UserName('admin_user');
    const profile = new UserProfileDetails('Admin User', 'Bio', '');
    const passwordHash = new HashedPassword('hashed_password');
    const subscription = new UserSubscriptionStatus(
      SubscriptionState.ACTIVE,
      SubscriptionPlan.FREE,
      DateISO.createFrom('2099-12-31'),
    );
    const preferences = UserPreferences.create('LIGHT');

    const user = User.create(
      userId,
      email,
      username,
      profile,
      passwordHash,
      UserType.STUDENT,
      subscription,
      preferences,
      UserState.ACTIVE,
      [UserRole.USER],
    );

    this.userRepoMock.findById.mockResolvedValue(new Optional<User>(user));
    return this;
  }

  /**
   * Simula un error crítico en la capa de persistencia (Infraestructura).
   */

  public givenTheStorageIsDown(message = 'Database Connection Timeout'): this {
    const adminId = CreateGroupCommandMother.validGroup().adminId;
    const userId = new UserId(adminId);
    const email = new UserEmail('admin@test.com');
    const username = new UserName('admin_user');
    const profile = new UserProfileDetails('Admin User', 'Bio', '');
    const passwordHash = new HashedPassword('hashed_password');
    const subscription = new UserSubscriptionStatus(
      SubscriptionState.ACTIVE,
      SubscriptionPlan.FREE,
      DateISO.createFrom('2099-12-31'),
    );
    const preferences = UserPreferences.create('LIGHT');

    const user = User.create(
      userId,
      email,
      username,
      profile,
      passwordHash,
      UserType.STUDENT,
      subscription,
      preferences,
      UserState.ACTIVE,
      [UserRole.USER],
    );

    this.userRepoMock.findById.mockResolvedValue(new Optional<User>(user));

    // Simular el error de almacenamiento
    const error = new Error(message);
    this.repoMock.save.mockRejectedValue(error);
    return this;
  }

  /**
   * Prepara un comando válido para ser procesado por el caso de uso.
   */
  public givenAValidGroupCreationRequest(): this {
    this.currentCommand = CreateGroupCommandMother.validGroup();
    return this;
  }

  /**
   * Prepara un comando que fallará debido a reglas de negocio (nombre inválido).
   */
  public givenAGroupCreationRequestWithInvalidName(): this {
    this.currentCommand = CreateGroupCommandMother.invalidGroupWithShortName();
    return this;
  }

  // ============ WHEN: Ejecución del Caso de Uso (SUT) ============

  /**
   * Ejecuta el CreateGroupHandler (System Under Test).
   * Instancia el servicio con los mocks actuales y dispara la acción.
   */
  public async whenCreatingGroup(): Promise<this> {
    if (!this.currentCommand) {
      throw new Error(
        "No se ha configurado un comando. Usa métodos 'given...Request'",
      );
    }

    const handler = new CreateGroupHandler(
      this.repoMock,
      this.userRepoMock,
      this.eventBusMock,
      this.loggerMock,
    );

    this.result = await handler.execute(this.currentCommand);
    return this;
  }

  // ============ THEN: Verificaciones ============

  /**
   * Verifica que el flujo terminó correctamente y los datos llegaron al repositorio.
   */
  public thenShouldBePersisted(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(this.repoMock.save).toHaveBeenCalled();
    expect(this.result?.isRight()).toBe(true);
  }

  /**
   * Verifica que el servicio detuvo la creación debido a una violación de política.
   */
  public thenShouldFailDueToViolationOf(policyMessage: string): void {
    expect(this.result?.isLeft()).toBe(true);
    const error = this.result?.getLeft();
    expect(error?.message.toLowerCase()).toContain(policyMessage.toLowerCase());
  }
}
