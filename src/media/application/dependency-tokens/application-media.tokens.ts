// src/media/application/tokens/media.tokens.ts

// Storage & Crypto & Utils
export const ASSET_STORAGE_SERVICE = 'IAssetStorageService';
export const CRYPTO_SERVICE = 'ICryptoService';
export const ASSET_URL_GENERATOR = 'IAssetUrlGenerator';
export const ERROR_MAPPER = 'IErrorMapper';
export const CLOUDINARY_CONFIG = 'CLOUDINARY_CONFIG';

// Ports / Services (Aplicación interna - Genéricos)
export const IMAGE_URL_ENRICHER = 'IImageUrlEnricher';
export const THEME_ENRICHER = 'IThemeEnricher';

// Ports / Enrichers Específicos (Para Inyección de Dependencias)
export const KAHOOT_MEDIA_ENRICHER = 'IKahootMediaEnricher';
export const SLIDE_MEDIA_ENRICHER = 'ISlideMediaEnricher';
export const OPTION_MEDIA_ENRICHER = 'IOptionMediaEnricher';
export const STYLING_MEDIA_ENRICHER = 'IStylingMediaEnricher';

export const MEDIA_TOKENS = {
  // Infraestructura
  ASSET_STORAGE_SERVICE,
  CRYPTO_SERVICE,
  ASSET_URL_GENERATOR,
  ERROR_MAPPER,
  CLOUDINARY_CONFIG,
  
  // Servicios de Dominio
  IMAGE_URL_ENRICHER,
  THEME_ENRICHER,

  // Enrichers
  KAHOOT_MEDIA_ENRICHER,
  SLIDE_MEDIA_ENRICHER,
  OPTION_MEDIA_ENRICHER,
  STYLING_MEDIA_ENRICHER
} as const;