// src/media/application/dependency-tokens/application-media.tokens.ts

// Infrastructure
export const ASSET_STORAGE_SERVICE = 'IAssetStorageService';
export const CRYPTO_SERVICE = 'ICryptoService';
export const ASSET_URL_GENERATOR = 'IAssetUrlGenerator';
export const ERROR_MAPPER = 'IErrorMapper';
export const CLOUDINARY_CONFIG = 'CLOUDINARY_CONFIG';

// Services & Ports
export const IMAGE_URL_ENRICHER = 'IImageUrlEnricher';
export const THEME_ENRICHER = 'IThemeEnricher';
export const ENRICHMENT_HANDLER_FACTORY = 'IEnrichmentHandlerFactory';

// New Handlers & Config (Internal Application)
export const URL_ENRICHMENT_HANDLER = 'UrlEnrichmentHandler';
export const THEME_ENRICHMENT_HANDLER = 'ThemeEnrichmentHandler';
export const URL_CONFIGURABLE = 'IUrlConfigurable';

export const MEDIA_TOKENS = {
  ASSET_STORAGE_SERVICE,
  CRYPTO_SERVICE,
  ASSET_URL_GENERATOR,
  ERROR_MAPPER,
  CLOUDINARY_CONFIG,
  IMAGE_URL_ENRICHER,
  THEME_ENRICHER,
  ENRICHMENT_HANDLER_FACTORY,
  URL_ENRICHMENT_HANDLER,
  THEME_ENRICHMENT_HANDLER,
  URL_CONFIGURABLE
} as const;