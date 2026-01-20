/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\queries\get-themes\get-themes.proxy.ts

import { Injectable, Inject } from '@nestjs/common';
import { Either, ErrorData } from 'src/core/types';
import { MEDIA_TOKENS } from '../../dependency-tokens/application-media.tokens';
import { ThemeResponse } from '../../dtos/theme.response.dto';
import { GetThemesQuery } from './get-themes.query';
import type { IQueryHandler } from 'src/core/application/cqrs';
import { QueryHandler } from 'src/core/infrastructure/cqrs';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

@Injectable()
@QueryHandler(GetThemesQuery)
export class ThemeListProxy implements IQueryHandler<GetThemesQuery> {
  // Cache de la lista completa
  private cachedList: Either<ErrorData, ThemeResponse[]> | null = null;
  private lastUpdate = 0;
  private readonly TTL = 1000 * 60 * 10; // 10 minutos

  constructor(
    @Inject(MEDIA_TOKENS.RAW_THEME_LIST_QUERY_HANDLER)
    private readonly decoratee: IQueryHandler<GetThemesQuery>,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER)
    private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(
    query: GetThemesQuery,
  ): Promise<Either<ErrorData, ThemeResponse[]>> {
    const now = Date.now();

    // 1. Hit de caché
    if (this.cachedList && now - this.lastUpdate < this.TTL) {
      return this.cachedList;
    }

    // 2. Llamada al decoratee con casting manual
    // Como IQueryHandler<GetThemesQuery> devuelve unknown por defecto en el bus,
    // forzamos el tipo que sabemos que el 'hijo' retorna.
    const result = (await this.decoratee.execute(query)) as Either<
      ErrorData,
      ThemeResponse[]
    >;

    // 3. Actualización de caché si es Right
    if (result.isRight()) {
      this.cachedList = result;
      this.lastUpdate = now;
    }

    return result;
  }
}
