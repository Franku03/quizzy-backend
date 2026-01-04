// src/media/application/queries/get-themes/get-themes.handler.ts

import { QueryHandler } from "src/core/infrastructure/cqrs";
import { GetThemesQuery } from "./get-themes.query";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { Inject } from "@nestjs/common";
import { ASSET_URL_GENERATOR} from "src/media/application/dependency-tokens/application-media.tokens";
import type { IAssetUrlGenerator } from "src/media/application/ports/i-asset-url-generator.interface";
import type { IAssetMetadataDao } from "src/media/application/ports/i-asset-metadata.dao.interface";
import { IQueryHandler } from "src/core/application/cqrs/query-handler.interface";
import { Either, ErrorData } from "src/core/types";
import { ThemeResponse } from "../../dtos/theme.response.dto";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";

@QueryHandler(GetThemesQuery)
export class GetThemesHandler implements IQueryHandler<GetThemesQuery> {
  
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao,
    @Inject(ASSET_URL_GENERATOR)
    private readonly urlService: IAssetUrlGenerator,
  ) {}

  async execute(query: GetThemesQuery): Promise<Either<ErrorData, ThemeResponse[]>> {
    
    return pipeAsync(
      // 1. Extracción: Obtenemos los records del DAO
      this.metadataDao.findThemes(query),

      // 2. Transformación: Enriquecemos con URLs y mapeamos al DTO
      k => k.map(records => {
        // Generamos el batch de URLs de una sola vez
        const publicIds = records.map(r => r.publicId);
        const urlMap = this.urlService.generateUrls(publicIds);

        // Retornamos el array ya mapeado
        return records.map(record => ({
          assetId: record.assetId,
          url: urlMap.get(record.publicId) || '',
          name: record.originalName,
          category: record.category,
          format: record.format,
          size: record.size,
          mimeType: record.mimeType,
        }));
      })
    );
  }
}