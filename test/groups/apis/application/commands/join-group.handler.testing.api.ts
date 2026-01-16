/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\apis\application\commands\join-group.handler.testing.api.ts

import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData, Optional } from 'src/core/types';
import { ErrorLayer } from 'src/core/errors/error.enum';

// --- Capa de Dominio ---
import { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { Group } from 'src/groups/domain/aggregates/group';
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
import { InvitationToken } from 'src/groups/domain/value-objects/group.invitation.token';
import { ITokenGenerator } from 'src/groups/domain/domain-services/i.token-generator.service.interface';

// --- Capa de Aplicación (SUT y Dependencias) ---
import { JoinGroupCommand } from 'src/groups/application/commands/join-group/join-group.command';
import { JoinGroupHandler } from 'src/groups/application/commands/join-group/join-group.handler';
import { JoinGroupResponse } from 'src/groups/application/commands/response-dtos/join-group.response.dto';
import { ILogger } from 'src/core/application/aspects/logging/logger.interface';

// --- Object Mothers (Datos predefinidos para pruebas) ---
import { JoinGroupCommandMother } from '../../../object-mothers/application/commands/join-group.command.mother';
import { CreateGroupCommandMother } from '../../../object-mothers/application/commands/create-group.command.mother';

/**
 * API de soporte para las pruebas unitarias del caso de uso "Unirse a Group".
 */
export class JoinGroupTestAPI {
  // Definición de Mocks para los puertos de los que depende el servicio de aplicación
  private repoMock: MockProxy<IGroupRepository> = mock<IGroupRepository>();
  private userRepoMock: MockProxy<IUserRepository> = mock<IUserRepository>();
  private loggerMock: MockProxy<ILogger> = mock<ILogger>();

  // Estado interno para almacenar el estímulo (comando) y la respuesta del SUT
  private result?: Either<ErrorData, JoinGroupResponse>;
  private currentCommand?: JoinGroupCommand;
  private currentGroup?: Group;

  // Constantes para tests
  private readonly ADMIN_ID = CreateGroupCommandMother.validGroup().adminId;
  private readonly GROUP_ID = '7aa6533f-2316-426f-83ec-8b2b85e11262';
  private readonly MEMBER_ID = JoinGroupCommandMother.validJoinRequest().userId;
  private readonly VALID_TOKEN = JoinGroupCommandMother.validJoinRequest().invitationToken;

  constructor() {
    this.configureDefaultMocks();
  }

  /**
   * Establece una configuración base para los mocks.
   */
  private configureDefaultMocks(): void {
    this.repoMock.save.mockResolvedValue();
  }

  /**
   * Crea un usuario válido para los tests.
   */
  private createUser(userId: string, isPremium: boolean = false): User {
    const userIdVO = new UserId(userId);
    const email = new UserEmail(`${userId}@test.com`);
    const username = new UserName(`user_${userId.substring(0, 8)}`);
    const profile = new UserProfileDetails('Test User', 'Bio', '');
    const passwordHash = new HashedPassword('hashed_password');
    const subscription = new UserSubscriptionStatus(
      SubscriptionState.ACTIVE,
      isPremium ? SubscriptionPlan.MONTHLY_PREMIUM : SubscriptionPlan.FREE,
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

  /**
   * Crea un grupo con token de invitación válido.
   */
  private createGroupWithInvitation(
    adminId: string,
    tokenValue: string,
    expiresInDays: number = 7,
  ): Group {
    const group = Group.create(
      this.GROUP_ID,
      'Grupo con Invitación',
      adminId,
      'Grupo que tiene un token de invitación',
    );

    // Usamos el método generateInvitation del agregado
    const tokenGenerator: ITokenGenerator = {
      generate: () => tokenValue,
    };

    group.generateInvitation(new UserId(adminId), tokenGenerator, expiresInDays);

    return group;
  }

  // ============ GIVEN: Definición de Escenarios ============

  /**
   * Simula que el repositorio funciona correctamente.
   */
  public givenTheSystemIsReadyToStoreData(): this {
    this.repoMock.save.mockResolvedValue();
    return this;
  }

  /**
   * Simula un grupo existente con un token de invitación válido.
   */
  public givenAnExistingGroupWithValidInvitation(
    adminId: string = this.ADMIN_ID,
    tokenValue: string = this.VALID_TOKEN,
  ): this {
    this.currentGroup = this.createGroupWithInvitation(adminId, tokenValue);

    this.repoMock.findByInvitationToken.mockResolvedValue(
      new Optional<Group>(this.currentGroup),
    );

    // Configurar mocks de usuarios (admin y usuario que se une)
    const admin = this.createUser(adminId, false);
    const userToJoin = this.createUser(this.MEMBER_ID, false);

    this.userRepoMock.findById.mockImplementation((userId: UserId) => {
      if (userId.value === adminId) {
        return Promise.resolve(new Optional<User>(admin));
      }
      if (userId.value === this.MEMBER_ID) {
        return Promise.resolve(new Optional<User>(userToJoin));
      }
      return Promise.resolve(new Optional<User>());
    });

    return this;
  }

  /**
   * Simula un grupo que no existe (token inválido).
   */
  public givenAnInvalidInvitationToken(tokenValue: string = 'invalid-token'): this {
    this.repoMock.findByInvitationToken.mockResolvedValue(new Optional<Group>());
    return this;
  }

  /**
   * Simula que el admin del grupo es premium.
   */
  public givenTheGroupAdminIsPremium(adminId: string = this.ADMIN_ID): this {
    if (!this.currentGroup) {
      this.currentGroup = this.createGroupWithInvitation(adminId, this.VALID_TOKEN);
      this.repoMock.findByInvitationToken.mockResolvedValue(
        new Optional<Group>(this.currentGroup),
      );
    }

    const admin = this.createUser(adminId, true);
    const userToJoin = this.createUser(this.MEMBER_ID, false);

    this.userRepoMock.findById.mockImplementation((userId: UserId) => {
      if (userId.value === adminId) {
        return Promise.resolve(new Optional<User>(admin));
      }
      if (userId.value === this.MEMBER_ID) {
        return Promise.resolve(new Optional<User>(userToJoin));
      }
      return Promise.resolve(new Optional<User>());
    });

    return this;
  }

  /**
   * Simula un grupo con 5 miembros (límite para admin no premium).
   */
  public givenAGroupWithMaximumMembers(adminId: string = this.ADMIN_ID): this {
    const group = this.createGroupWithInvitation(adminId, this.VALID_TOKEN);

    // Obtener el token real del grupo después de generarlo
    const groupPrimitives = group.toPrimitives();
    const groupToken = groupPrimitives.invitationToken;
    
    if (!groupToken) {
      throw new Error('El grupo debe tener un token de invitación');
    }

    // Agregar 4 miembros adicionales (el admin ya es el primero, total = 5)
    const memberIds = [
      'member-1',
      'member-2',
      'member-3',
      'member-4',
    ];

    memberIds.forEach((memberId) => {
      // Usar el mismo token del grupo
      const token = InvitationToken.fromPrimitives(
        groupToken.value,
        groupToken.expiresAt,
      );
      group.joinGroup(new UserId(memberId), token, false);
    });

    this.currentGroup = group;
    this.repoMock.findByInvitationToken.mockResolvedValue(
      new Optional<Group>(this.currentGroup),
    );

    const admin = this.createUser(adminId, false);
    const userToJoin = this.createUser(this.MEMBER_ID, false);

    this.userRepoMock.findById.mockImplementation((userId: UserId) => {
      if (userId.value === adminId) {
        return Promise.resolve(new Optional<User>(admin));
      }
      if (userId.value === this.MEMBER_ID) {
        return Promise.resolve(new Optional<User>(userToJoin));
      }
      return Promise.resolve(new Optional<User>());
    });

    return this;
  }

  /**
   * Simula un error crítico en la capa de persistencia (Infraestructura).
   */
  public givenTheStorageIsDown(message = 'Database Connection Timeout'): this {
    // Configurar grupo y usuarios primero
    this.givenAnExistingGroupWithValidInvitation();

    // Simular el error de almacenamiento
    const error = new Error(message);
    this.repoMock.save.mockRejectedValue(error);
    return this;
  }

  /**
   * Prepara un comando válido para ser procesado.
   */
  public givenAValidJoinRequest(
    userId: string = this.MEMBER_ID,
    token: string = this.VALID_TOKEN,
  ): this {
    this.currentCommand = JoinGroupCommandMother.joinRequest(userId, token);
    return this;
  }

  // ============ WHEN: Ejecución del Caso de Uso (SUT) ============

  /**
   * Ejecuta el JoinGroupHandler (System Under Test).
   */
  public async whenJoiningGroup(): Promise<this> {
    if (!this.currentCommand) {
      throw new Error(
        "No se ha configurado un comando. Usa métodos 'given...Request'",
      );
    }

    const handler = new JoinGroupHandler(
      this.repoMock,
      this.userRepoMock,
      this.loggerMock,
    );

    this.result = await handler.execute(this.currentCommand);
    return this;
  }

  // ============ THEN: Verificaciones ============

  /**
   * Verifica que el flujo terminó correctamente y el usuario se unió al grupo.
   */
  public thenShouldJoinSuccessfully(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(this.repoMock.save).toHaveBeenCalled();
    expect(this.result?.isRight()).toBe(true);
  }

  /**
   * Verifica que el servicio rechazó la unión debido a una violación de política.
   */
  public thenShouldFailDueToViolationOf(policyMessage: string): void {
    expect(this.result?.isLeft()).toBe(true);
    const error = this.result?.getLeft();
    expect(error?.message.toLowerCase()).toContain(policyMessage.toLowerCase());
  }
}
