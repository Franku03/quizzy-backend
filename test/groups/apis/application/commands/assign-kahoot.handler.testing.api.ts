/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\apis\application\commands\assign-kahoot.handler.testing.api.ts

import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData, Optional } from 'src/core/types';
import { ErrorLayer } from 'src/core/errors/error.enum';

// --- Capa de Dominio ---
import { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { Group } from 'src/groups/domain/aggregates/group';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { IGroupsDao } from 'src/groups/application/queries/ports/groups.dao.port';
import { EventBus } from 'src/core/domain/ports/event-bus.port';
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
import { AssignKahootToGroupCommand } from 'src/groups/application/commands/assign-kahoot/assign-kahoot.command';
import { AssignKahootToGroupHandler } from 'src/groups/application/commands/assign-kahoot/assign-kahoot.handler';
import { AssignKahootToGroupResponse } from 'src/groups/application/commands/response-dtos/assign-kahoot.response.dto';
import { ILogger } from 'src/core/application/aspects/logging/logger.interface';

// --- Object Mothers (Datos predefinidos para pruebas) ---
import { AssignKahootCommandMother } from '../../../object-mothers/application/commands/assign-kahoot.command.mother';
import { CreateGroupCommandMother } from '../../../object-mothers/application/commands/create-group.command.mother';
import { KahootAggregateMother } from '../../../../kahoots/object-mothers/domain/aggregate/kahoot.mother';

/**
 * API de soporte para las pruebas unitarias del caso de uso "Asignar Kahoot a Group".
 */
export class AssignKahootTestAPI {
  // Definición de Mocks para los puertos de los que depende el servicio de aplicación
  private repoMock: MockProxy<IGroupRepository> = mock<IGroupRepository>();
  private kahootRepoMock: MockProxy<IKahootRepository> = mock<IKahootRepository>();
  private userRepoMock: MockProxy<IUserRepository> = mock<IUserRepository>();
  private groupsDaoMock: MockProxy<IGroupsDao> = mock<IGroupsDao>();
  private eventBusMock: MockProxy<EventBus> = mock<EventBus>();
  private loggerMock: MockProxy<ILogger> = mock<ILogger>();

  // Estado interno para almacenar el estímulo (comando) y la respuesta del SUT
  private result?: Either<ErrorData, AssignKahootToGroupResponse>;
  private currentCommand?: AssignKahootToGroupCommand;
  private currentGroup?: Group;
  private currentKahoot?: Kahoot;

  // Constantes para tests
  private readonly ADMIN_ID = CreateGroupCommandMother.validGroup().adminId;
  private readonly GROUP_ID = '7aa6533f-2316-426f-83ec-8b2b85e11262';
  private readonly KAHOOT_ID = KahootAggregateMother.KAHOOT_ID;

  constructor() {
    this.configureDefaultMocks();
  }

  /**
   * Establece una configuración base para los mocks.
   */
  private configureDefaultMocks(): void {
    this.repoMock.save.mockResolvedValue();
    this.eventBusMock.publish.mockResolvedValue();
    // Por defecto, el usuario es admin del grupo
    this.groupsDaoMock.isGroupAdmin.mockResolvedValue(true);
  }

  // ============ GIVEN: Definición de Escenarios ============

  /**
   * Simula que el repositorio funciona correctamente.
   */
  public givenTheSystemIsReadyToStoreData(): this {
    this.repoMock.save.mockResolvedValue();
    this.eventBusMock.publish.mockResolvedValue();
    this.groupsDaoMock.isGroupAdmin.mockResolvedValue(true);
    return this;
  }

  /**
   * Simula un grupo existente donde el usuario es admin.
   */
  public givenAnExistingGroupWhereUserIsAdmin(
    groupId: string = this.GROUP_ID,
    adminId: string = this.ADMIN_ID,
  ): this {
    this.currentGroup = Group.create(
      groupId,
      'Grupo de Prueba',
      adminId,
      'Descripción del grupo',
    );

    this.repoMock.findById.mockResolvedValue(
      new Optional<Group>(this.currentGroup),
    );

    // Configurar el DAO para que la autorización pase
    this.groupsDaoMock.isGroupAdmin.mockResolvedValue(true);

    // Mock del usuario admin
    const admin = this.createUser(adminId);
    this.userRepoMock.findById.mockResolvedValue(new Optional<User>(admin));

    return this;
  }

  /**
   * Simula un kahoot existente y publicado.
   */
  public givenAnExistingPublishedKahoot(kahootId: string = this.KAHOOT_ID): this {
    this.currentKahoot = KahootAggregateMother.existingPublished();
    const kahootIdVO = new KahootId(kahootId);
    this.kahootRepoMock.findKahootById.mockResolvedValue(
      new Optional<Kahoot>(this.currentKahoot),
    );
    return this;
  }

  /**
   * Simula un kahoot en estado DRAFT.
   */
  public givenAnExistingDraftKahoot(kahootId: string = this.KAHOOT_ID): this {
    this.currentKahoot = KahootAggregateMother.existingDraft();
    const kahootIdVO = new KahootId(kahootId);
    this.kahootRepoMock.findKahootById.mockResolvedValue(
      new Optional<Kahoot>(this.currentKahoot),
    );
    return this;
  }

  /**
   * Simula un grupo donde el kahoot ya está asignado.
   */
  public givenAGroupWithKahootAlreadyAssigned(
    adminId: string = this.ADMIN_ID,
    kahootId: string = this.KAHOOT_ID,
  ): this {
    this.currentGroup = Group.create(
      this.GROUP_ID,
      'Grupo con Kahoot',
      adminId,
    );

    const now = new Date();
    const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Asignar el kahoot al grupo
    this.currentGroup.assignKahoot(
      new UserId(adminId),
      new KahootId(kahootId),
      from,
      to,
    );

    this.repoMock.findById.mockResolvedValue(
      new Optional<Group>(this.currentGroup),
    );

    this.groupsDaoMock.isGroupAdmin.mockResolvedValue(true);
    const admin = this.createUser(adminId);
    this.userRepoMock.findById.mockResolvedValue(new Optional<User>(admin));

    return this;
  }

  /**
   * Simula un error crítico en la capa de persistencia (Infraestructura).
   */
  public givenTheStorageIsDown(message = 'Database Connection Timeout'): this {
    // Configurar grupo y kahoot primero
    this.givenAnExistingGroupWhereUserIsAdmin();
    this.givenAnExistingPublishedKahoot();

    // Simular el error de almacenamiento
    const error = new Error(message);
    this.repoMock.save.mockRejectedValue(error);
    return this;
  }

  /**
   * Prepara un comando válido para ser procesado.
   */
  public givenAValidAssignKahootRequest(
    groupId: string = this.GROUP_ID,
    userId: string = this.ADMIN_ID,
    kahootId: string = this.KAHOOT_ID,
  ): this {
    const now = new Date();
    const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    this.currentCommand = new AssignKahootToGroupCommand(groupId, userId, kahootId, from, to);
    return this;
  }

  /**
   * Prepara un comando inválido con fechas invertidas.
   */
  public givenAnAssignKahootRequestWithInvertedDates(): this {
    this.currentCommand = AssignKahootCommandMother.invalidAssignmentWithInvertedDates();
    return this;
  }

  /**
   * Crea un usuario válido para los tests.
   */
  private createUser(userId: string): User {
    const userIdVO = new UserId(userId);
    const email = new UserEmail(`${userId}@test.com`);
    const username = new UserName(`user_${userId.substring(0, 8)}`);
    const profile = new UserProfileDetails('Test User', 'Bio', '');
    const passwordHash = new HashedPassword('hashed_password');
    const subscription = new UserSubscriptionStatus(
      SubscriptionState.ACTIVE,
      SubscriptionPlan.FREE,
      DateISO.createFrom('2099-12-31'),
    );
    const preferences = UserPreferences.create('LIGHT');

    return User.create(
      userIdVO,
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
  }

  // ============ WHEN: Ejecución del Caso de Uso (SUT) ============

  /**
   * Ejecuta el AssignKahootToGroupHandler (System Under Test).
   */
  public async whenAssigningKahoot(): Promise<this> {
    if (!this.currentCommand) {
      throw new Error(
        "No se ha configurado un comando. Usa métodos 'given...Request'",
      );
    }

    const handler = new AssignKahootToGroupHandler(
      this.repoMock,
      this.kahootRepoMock,
      this.userRepoMock,
      this.loggerMock,
      this.groupsDaoMock,
      this.eventBusMock,
    );

    this.result = await handler.execute(this.currentCommand);
    return this;
  }

  // ============ THEN: Verificaciones ============

  /**
   * Verifica que el flujo terminó correctamente y el kahoot fue asignado al grupo.
   */
  public thenShouldAssignSuccessfully(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(this.repoMock.save).toHaveBeenCalled();
    expect(this.result?.isRight()).toBe(true);
  }

  /**
   * Verifica que el servicio rechazó la asignación debido a una violación de política.
   */
  public thenShouldFailDueToViolationOf(policyMessage: string): void {
    expect(this.result?.isLeft()).toBe(true);
    const error = this.result?.getLeft();
    expect(error?.message.toLowerCase()).toContain(policyMessage.toLowerCase());
  }
}
