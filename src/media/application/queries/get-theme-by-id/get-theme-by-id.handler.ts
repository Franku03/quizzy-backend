// src/media/application/queries/get-theme-by-id/get-theme-by-id.handler.ts

import { QueryHandler } from "src/core/infrastructure/cqrs";
import { GetThemeByIdQuery } from "./get-theme-by-id.query";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { Inject } from "@nestjs/common";
import { MEDIA_TOKENS} from "src/media/application/dependency-tokens/application-media.tokens";
import type { IAssetUrlGenerator } from "src/media/application/ports/i-asset-url-generator.interface";
import type { IAssetMetadataDao } from "src/media/application/ports/i-asset-metadata.dao.interface";
import { IQueryHandler } from "src/core/application/cqrs/query-handler.interface";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { ThemeResponse } from "../../dtos/theme.response.dto";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { AssetMetadataRecord } from "../../ports/i-asset-metadata-record.interface";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";

@QueryHandler(GetThemeByIdQuery)
export class GetThemeByIdHandler implements IQueryHandler<GetThemeByIdQuery> {
  
  constructor(
    @Inject(DaoName.AssetMetadataMongo) private readonly metadataDao: IAssetMetadataDao,
    @Inject(MEDIA_TOKENS.ASSET_URL_GENERATOR) private readonly urlService: IAssetUrlGenerator,
    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) {}

  @Log()
  async execute(query: GetThemeByIdQuery): Promise<Either<ErrorData, ThemeResponse>> {
    return pipeAsync<ErrorData, ThemeResponse>(
      this.metadataDao.findThemeById(query.assetId),
      result => result.map(record => this.mapToEnrichedResponse(record))
    );
  }

  private mapToEnrichedResponse(record: AssetMetadataRecord): ThemeResponse {
    const url = this.urlService.generateUrl(record.publicId);
    
    return {
      assetId: record.assetId,
      url: url || '',
      name: record.originalName,
      category: record.category,
      format: record.format,
      size: record.size,
      mimeType: record.mimeType,
    };
  }
}