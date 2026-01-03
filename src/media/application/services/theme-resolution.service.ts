import { Injectable, Inject } from "@nestjs/common";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { Either, ErrorData } from "src/core/types";
import { ThemeObject } from "src/core/types/theme.object";
import { MEDIA_TOKENS } from "../dependency-tokens/application-media.tokens";
import { AssetMetadataRecord } from "../ports/i-asset-metadata-record.interface";
import type { IAssetMetadataDao } from "../ports/i-asset-metadata.dao.interface";
import type { IAssetUrlGenerator } from "../ports/i-asset-url-generator.interface";
import { IThemeEnricher } from "../ports/i-theme-enricher.interface";
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalogue.enum";


@Injectable()
export class ThemeResolutionService implements IThemeEnricher {
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly mediaDao: IAssetMetadataDao,
    
    @Inject(MEDIA_TOKENS.ASSET_URL_GENERATOR)
    private readonly urlGenerator: IAssetUrlGenerator,
  ) {}

  async enrichTheme(assetId: string): Promise<Either<ErrorData, ThemeObject | null>> {
    return pipeAsync(
      Either.makeRight<ErrorData, string>(assetId),

      (e) => e.chainAsync(id => {
          if (!id) {
              return Promise.resolve(
                  Either.makeRight<ErrorData, AssetMetadataRecord | null>(null)
              );
          }
          return this.mediaDao.findThemeById(id);
      }),

      (e) => e.map(record => {
          if (!record) return null;
          return this.mapRecordToTheme(record);
      })
    );
  }

  private mapRecordToTheme(record: AssetMetadataRecord): ThemeObject {
    return {
      id: record.assetId, 
      url: this.urlGenerator.generateUrl(record.publicId), 
      name: record.originalName || 'Sin Título'
    };
  }
}