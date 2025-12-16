// src/media/application/tokens/media.tokens.ts

/**
 * Tokens para inyección de dependencias en el módulo de Media.
 * Estos tokens definen los contratos que la capa de aplicación necesita.
 */

// Storage
export const ASSET_STORAGE_SERVICE = 'IAssetStorageService';

// Crypto
export const CRYPTO_SERVICE = 'ICryptoService';

// URL Services
export const ASSET_ID_TO_URL_SERVICE = 'IAssetIdToUrlService';
export const ASSET_URL_SERVICE = 'IAssetUrlService';

// Error Handling
export const ERROR_MAPPER = 'IErrorMapper';


// External Services
export const CLOUDINARY_CONFIG = 'CLOUDINARY_CONFIG';

export const MEDIA_TOKENS = {
  ASSET_STORAGE_SERVICE,
  CRYPTO_SERVICE,
  ASSET_ID_TO_URL_SERVICE,
  ASSET_URL_SERVICE,
  ERROR_MAPPER,
  CLOUDINARY_CONFIG,
} as const;