/* eslint-disable @typescript-eslint/unbound-method */
/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\backoffice\apis\application\commands\block-user.handler.testing.api.ts

import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData } from 'src/core/types';

// --- Capa de Dominio ---
import { User } from 'src/users/domain/aggregates/user';
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';

// --- Capa de Aplicación (SUT y Contratos) ---
import { BlockUserCommand } from 'src/backoffice/application/commands/block-user/block-user.command';
import { BlockUserHandler } from 'src/backoffice/application/commands/block-user/block-user.handler';
import { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { BackOfficeUserReadModel } from 'src/backoffice/application/read-model/backoffice-user.read.model';

// --- Object Mothers ---
import { BlockUserCommandMother } from 'test/backoffice/object-mothers/application/commands/block-user.command.mother';

/**
 * API de testing solo para los 2 escenarios necesarios
 */
export class BlockUserTestAPI {
  // --- Mocks de dependencias ---
  private repoMock: MockProxy<IUserRepository> = mock<IUserRepository>();
  private mediaServiceMock: MockProxy<MediaEnrichmentService> =
    mock<MediaEnrichmentService>();
  private loggerMock: MockProxy<ILogger> = mock<ILogger>();

  // --- Estado interno ---
  private result?: Either<ErrorData, BackOfficeUserReadModel>;
  private currentCommand?: BlockUserCommand;
  private userToBlock?: MockProxy<User>;

  constructor() {
    this.configureDefaultMocks();
  }

  /**
   * Configuración base de los mocks para operaciones comunes
   * Establece comportamientos por defecto que pueden ser sobrescritos
   */
  private configureDefaultMocks(): void {
    // Configuración por defecto del servicio de enriquecimiento de medios
    // Retorna el mismo modelo sin modificaciones
    this.mediaServiceMock.enrinchBackofficeUserReadModel.mockImplementation(
      (model) => Promise.resolve(model),
    );

    // Configuración por defecto del repositorio para operaciones de guardado
    // Retorna un modelo de usuario básico cuando no se especifica otro comportamiento
    this.repoMock.saveAndGetBackofficeUserEither.mockImplementation(() => {
      const defaultReadModel = new BackOfficeUserReadModel(
        'default-id',
        'default_user',
        'Default User',
        'default@example.com',
        'Default description',
        'STUDENT',
        null,
        '2024-01-01T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z',
        false,
        'Active',
      );
      return Promise.resolve(Either.makeRight(defaultReadModel));
    });
  }

  // ============ GIVEN ============

  /**
   * Configura un usuario activo que puede ser bloqueado
   * Crea un mock de usuario con estado activo y configurado para ser encontrado por el repositorio
   */
  public givenAnActiveUserExists(): this {
    this.userToBlock = mock<User>();

    // Configuración del identificador del usuario
    const mockUserId = {
      value: BlockUserCommandMother.getUserId(),
    };

    // Establece el identificador del usuario mockeado
    Object.defineProperty(this.userToBlock, 'id', {
      value: mockUserId,
      writable: true,
      configurable: true,
    });

    // Configura el usuario como activo y no bloqueado
    this.userToBlock.isBlocked.mockReturnValue(false);
    this.userToBlock.isActive.mockReturnValue(true);

    // Variables de estado para controlar el comportamiento del mock
    let userIsBlocked = false;
    let userIsActive = true;

    // Configura métodos que dependen del estado actual del usuario
    this.userToBlock.isBlocked.mockImplementation(() => userIsBlocked);
    this.userToBlock.isActive.mockImplementation(() => userIsActive);

    // Implementación del método block que actualiza el estado del usuario
    this.userToBlock.block.mockImplementation(() => {
      userIsBlocked = true;
      userIsActive = false;
    });

    // Configura el repositorio para encontrar el usuario mockeado
    this.repoMock.findUserByIdEither.mockResolvedValue(
      Either.makeRight(this.userToBlock),
    );

    return this;
  }

  /**
   * Configura el repositorio para guardar exitosamente
   * Establece que las operaciones de guardado retornarán un modelo de usuario activo
   */
  public givenTheSystemIsReadyToSaveData(): this {
    const readModel = new BackOfficeUserReadModel(
      BlockUserCommandMother.getUserId(),
      'test_user',
      'Test User',
      'test@example.com',
      'Test user description',
      'STUDENT',
      null,
      '2024-01-01T00:00:00.000Z',
      '2024-01-01T00:00:00.000Z',
      false,
      'Active',
    );

    this.repoMock.saveAndGetBackofficeUserEither.mockResolvedValue(
      Either.makeRight(readModel),
    );
    return this;
  }

  /**
   * Configura el repositorio para devolver usuario bloqueado
   * Establece que las operaciones de guardado retornarán un modelo de usuario en estado bloqueado
   */
  public givenTheSystemSavesBlockedUser(): this {
    const blockedReadModel = new BackOfficeUserReadModel(
      BlockUserCommandMother.getUserId(),
      'test_user',
      'Test User',
      'test@example.com',
      'Test user description',
      'STUDENT',
      null,
      '2024-01-01T00:00:00.000Z',
      '2024-01-01T00:00:00.000Z',
      false,
      'Blocked', // <-- ESTADO BLOQUEADO
    );

    this.repoMock.saveAndGetBackofficeUserEither.mockResolvedValue(
      Either.makeRight(blockedReadModel),
    );
    return this;
  }

  /**
   * Configura un comando donde admin intenta bloquearse a sí mismo
   * Prepara el escenario de autobloqueo para probar la validación de negocio
   */
  public givenAdminTriesToBlockHimself(): this {
    this.currentCommand = BlockUserCommandMother.adminBlocksHimself();
    return this;
  }

  /**
   * Configura un comando válido de bloqueo
   * Prepara el escenario normal donde un administrador bloquea a otro usuario
   */
  public givenAValidBlockUserCommand(): this {
    this.currentCommand = BlockUserCommandMother.valid();
    return this;
  }

  // ============ WHEN: Ejecución ============

  /**
   * Ejecuta el handler con el comando configurado
   * Crea una instancia del handler con los mocks y ejecuta la operación de bloqueo
   */
  public async whenBlockingUser(): Promise<this> {
    const handler = new BlockUserHandler(
      this.mediaServiceMock,
      this.repoMock,
      this.loggerMock,
    );
    this.result = await handler.execute(this.getCurrentCommand());
    return this;
  }

  // ============ THEN: Solo las verificaciones ============

  /**
   * Verifica que el bloqueo fue exitoso
   * Comprueba que el resultado es un Right (éxito) en el Either
   */
  public thenShouldBeSuccessfullyBlocked(): void {
    expect(this.result?.isRight()).toBe(true);
  }

  /**
   * Verifica que la operación falló con el mensaje específico
   * Comprueba que el resultado es un Left (error) y que contiene el mensaje de autobloqueo
   */
  public thenShouldFailDueToSelfBlock(): void {
    expect(this.result?.isLeft()).toBe(true);
    const error = this.result?.getLeft();
    // Mensaje EXACTO del handler
    expect(error?.message).toBe('An user can not block himself');
  }

  /**
   * Verifica que se llamó al método block del usuario
   * Asegura que la operación de bloqueo fue invocada en el agregado de usuario
   */
  public thenUserShouldBeMarkedAsBlocked(): void {
    if (!this.userToBlock) {
      throw new Error('userToBlock is not defined');
    }
    expect(this.userToBlock.block).toHaveBeenCalled();
  }

  /**
   * Verifica que se llamó al repositorio para guardar
   * Asegura que se persistieron los cambios en el usuario bloqueado
   */
  public thenUserShouldBeSaved(): void {
    expect(this.repoMock.saveAndGetBackofficeUserEither).toHaveBeenCalled();
  }

  /**
   * Verifica que el read model tiene estado "Blocked"
   * Comprueba que el modelo de lectura retornado refleja el estado bloqueado
   */
  public thenReadModelShouldBeBlocked(): void {
    expect(this.result?.isRight()).toBe(true);
    const readModel = this.result?.getRight();
    expect(readModel?.status).toBe('Blocked');
  }

  // ============ HELPERS ============

  /**
   * Obtiene el comando actualmente configurado
   * @returns El comando de bloqueo configurado para la ejecución
   * @throws Error si no se ha configurado ningún comando
   */
  private getCurrentCommand(): BlockUserCommand {
    if (!this.currentCommand) {
      throw new Error('Falta configurar el comando');
    }
    return this.currentCommand;
  }
}
