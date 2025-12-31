// src/media/application/queries/get-theme-by-id/get-theme-by-id.handler.ts

import { QueryHandler } from "src/core/infrastructure/cqrs";
import { GetThemeByIdQuery } from "./get-theme-by-id.query";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalogue.enum";
import { Inject } from "@nestjs/common";
import { ASSET_URL_SERVICE } from "src/media/application/dependecy-tokkens/application-media.tokens";
import type { IAssetUrlGenerator } from "src/media/application/ports/asset-url-generator.interface";
import type { IAssetMetadataDao } from "src/media/application/ports/asset-metadata.dao";
import { IQueryHandler } from "src/core/application/cqrs/query-handler.interface";
import { Either, ErrorData, ErrorLayer } from "src/core/types";
import { ThemeResponse } from "../dto/theme.response.dto";

@QueryHandler(GetThemeByIdQuery)
export class GetThemeByIdHandler implements IQueryHandler<GetThemeByIdQuery> {
  
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao,
    @Inject(ASSET_URL_SERVICE)
    private readonly urlService: IAssetUrlGenerator,
  ) {}

  async execute(query: GetThemeByIdQuery): Promise<Either<ErrorData, ThemeResponse>> {
    try {
      // 1. Buscar en DAO por assetId (tu implementación limpia)
      const result = await this.metadataDao.findThemeById(query.assetId);
      
      if (result.isLeft()) return Either.makeLeft(result.getLeft());
      
      const record = result.getRight();
      if (!record) {
        return Either.makeLeft(new ErrorData(
          "THEME_NOT_FOUND",
          `Theme with assetId ${query.assetId} not found`,
          ErrorLayer.APPLICATION
        ));
      }

      // 2. ENRIQUECIMIENTO (Generar URL única)
      const urlMap = this.urlService.generateUrl(record.publicId);

      // 3. MAPEO A RESPONSE
      const response: ThemeResponse = {
        assetId: record.assetId,
        url: urlMap || '',
        name: record.originalName,
        category: record.category,
        format: record.format,
        size: record.size,
        mimeType: record.mimeType,
      };

      return Either.makeRight(response);

    } catch (error) {
      return Either.makeLeft(new ErrorData(
        "APPLICATION_UNEXPECTED_ERROR",
        `Error retrieving theme ${query.assetId}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorLayer.APPLICATION
      ));
    }
  }
}