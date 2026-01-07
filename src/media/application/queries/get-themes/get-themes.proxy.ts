import { Injectable, Inject } from "@nestjs/common";
import { Either, ErrorData } from "src/core/types";
import { MEDIA_TOKENS } from "../../dependency-tokens/application-media.tokens";
import { ThemeResponse } from "../../dtos/theme.response.dto";
import { GetThemesQuery } from "./get-themes.query";
import type { IQueryHandler } from "src/core/application/cqrs";
import { QueryHandler } from "src/core/infrastructure/cqrs";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";

@Injectable()
@QueryHandler(GetThemesQuery)
export class ThemeListProxy implements IQueryHandler<GetThemesQuery> {
  // Cache de la lista completa (sar un Map con el query como llave si hay filtros - futuro refact)
  private cachedList: Either<ErrorData, ThemeResponse[]> | null = null;
  private lastUpdate: number = 0;
  private readonly TTL = 1000 * 60 * 10; // 10 minutos

  constructor(
    @Inject(MEDIA_TOKENS.RAW_THEME_LIST_QUERY_HANDLER) // El Handler original
    private readonly decoratee: IQueryHandler<GetThemesQuery>,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(query: GetThemesQuery): Promise<Either<ErrorData, ThemeResponse[]>> {
    const now = Date.now();

    // Si tenemos la lista y no ha expirado, devolvemos directo de RAM
    if (this.cachedList && (now - this.lastUpdate < this.TTL)) {
      return this.cachedList;
    }

    // Si no, llamamos al Handler real (MongoDB)
    const result = await this.decoratee.execute(query);
    
    // Guardamos en caché solo si es un éxito
    if (result.isRight()) {
      this.cachedList = result;
      this.lastUpdate = now;
    }

    return result;
  }
}