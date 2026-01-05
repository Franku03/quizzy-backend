// src/media/application/queries/get-themes/get-themes.handler.ts

import { QueryHandler } from "src/core/infrastructure/cqrs";
import { GetThemesQuery } from "./get-themes.query";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalogue.enum";
import { Inject } from "@nestjs/common";
import { ASSET_URL_GENERATOR } from "src/media/application/dependency-tokens/application-media.tokens";
import type { IAssetUrlGenerator } from "src/media/application/ports/i-asset-url-generator.interface";
import type { IAssetMetadataDao } from "src/media/application/ports/i-asset-metadata.dao.interface";
import { IQueryHandler } from "src/core/application/cqrs/query-handler.interface";
import { Either, ErrorData } from "src/core/types";
import { ThemeResponse } from "../../dtos/theme.response.dto";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { AssetMetadataRecord } from '../../ports/i-asset-metadata-record.interface';

@QueryHandler(GetThemesQuery)
export class GetThemesHandler implements IQueryHandler<GetThemesQuery> {
  
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao,
    @Inject(ASSET_URL_GENERATOR)
    private readonly urlService: IAssetUrlGenerator,
  ) {}

  @Log()
  async execute(query: GetThemesQuery): Promise<Either<ErrorData, ThemeResponse[]>> {
    return pipeAsync<ErrorData, ThemeResponse[]>(
      this.metadataDao.findThemes(query),
      result => result.map(records => this.enrichAndMap(records))
    );
  }

  private enrichAndMap(records: AssetMetadataRecord[]): ThemeResponse[] {
    const publicIds = records.map(r => r.publicId);
    const urlMap = this.urlService.generateUrls(publicIds);

    return records.map(record => ({
      assetId: record.assetId,
      url: urlMap.get(record.publicId) ?? '', 
      name: record.originalName,
      category: record.category,
      format: record.format,
      size: record.size,
      mimeType: record.mimeType,
    }));
  }
}