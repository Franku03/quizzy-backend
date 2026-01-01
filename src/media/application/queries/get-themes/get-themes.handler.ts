// src/media/application/queries/get-themes/get-themes.handler.ts

import { QueryHandler } from "src/core/infrastructure/cqrs";
import { GetThemesQuery } from "./get-themes.query";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalogue.enum";
import { Inject } from "@nestjs/common";
import { ASSET_URL_SERVICE } from "src/media/application/dependecy-tokkens/application-media.tokens";
import type { IAssetUrlGenerator } from "src/media/application/ports/asset-url-generator.interface";
import type { IAssetMetadataDao } from "src/media/application/ports/asset-metadata.dao";
import { IQueryHandler } from "src/core/application/cqrs/query-handler.interface";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { ThemeResponse } from "../dto/theme.response.dto";

@QueryHandler(GetThemesQuery)
export class GetThemesHandler implements IQueryHandler<GetThemesQuery> {
  
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao,
    @Inject(ASSET_URL_SERVICE)
    private readonly urlService: IAssetUrlGenerator,
  ) {}

  async execute(query: GetThemesQuery): Promise<Either<ErrorData, ThemeResponse[]>> {
    try {
      // 1. Persistencia / Extracción (DAO)
      const result = await this.metadataDao.findThemes(query);
      if (result.isLeft()) return Either.makeLeft(result.getLeft());
      
      const records = result.getRight();

      // 2. ENRIQUECIMIENTO (Lógica similar al MediaEnricher de Kahoots)
      // Generamos el batch de URLs
      const publicIds = records.map(r => r.publicId);

    // 2. Pasar el array de strings directamente al servicio
    const urlMap = this.urlService.generateUrls(publicIds);

      // 3. MAPEO A RESPONSE (Mismo estilo que tu KahootResponseService)
      const enrichedResponse: ThemeResponse[] = records.map(record => ({
        assetId: record.assetId,
        url: urlMap.get(record.publicId) || '',
        name: record.originalName,
        category: record.category,
        format: record.format,
        size: record.size,
        mimeType: record.mimeType,
      }));

      return Either.makeRight(enrichedResponse);

    } catch (error) {
      return Either.makeLeft(new ErrorData(
        "APPLICATION_UNEXPECTED_ERROR",
        `Unexpected error fetching themes: ${error instanceof Error ? error.message : String(error)}`,
        ErrorLayer.APPLICATION
      ));
    }
  }
}