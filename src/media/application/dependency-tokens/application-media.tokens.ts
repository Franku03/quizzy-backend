export const MEDIA_TOKENS = {
  // --- Infrastructure (External Ports) ---
  ASSET_STORAGE_SERVICE: Symbol('ASSET_STORAGE_SERVICE'),
  ASSET_URL_GENERATOR: Symbol('ASSET_URL_GENERATOR'),
  CLOUDINARY_CONFIG: Symbol('CLOUDINARY_CONFIG'),

  // --- Services (Public API for Handlers) ---
  // Proxies con Flyweight para resoluciones unitarias/batch (IDs)
  IMAGE_URL_ENRICHER: Symbol('IMAGE_URL_ENRICHER'),
  THEME_ENRICHER: Symbol('THEME_ENRICHER'),

  // --- Raw Services (Private API for Proxies) ---
  // Servicios base que consultan directamente la DB
  RAW_IMAGE_URL_ENRICHER: Symbol('RAW_IMAGE_URL_ENRICHER'),
  RAW_THEME_ENRICHER: Symbol('RAW_THEME_ENRICHER'),

  // --- API Query Proxies (Listados/Colecciones) ---
  // El Proxy que cachea el listado completo de temas (ThemeListProxy)
  THEME_LIST_QUERY_HANDLER: Symbol('THEME_LIST_QUERY_HANDLER'),
  // El Handler real que hace el find() en Mongo (GetThemesHandler)
  RAW_THEME_LIST_QUERY_HANDLER: Symbol('RAW_THEME_LIST_QUERY_HANDLER'),
  
  // --- Orchestration (Factories & Resolvers) ---
  MEDIA_ENRICHMENT_SERVICE: Symbol('MEDIA_ENRICHMENT_SERVICE'),
  ENRICHMENT_HANDLER_FACTORY: Symbol('ENRICHMENT_HANDLER_FACTORY'),
  HANDLER_RESOLVER: Symbol('HANDLER_RESOLVER'), 

  // --- Individual Handlers (Chain of Responsibility) ---
  URL_ENRICHMENT_HANDLER: Symbol('URL_ENRICHMENT_HANDLER'),
  THEME_ENRICHMENT_HANDLER: Symbol('THEME_ENRICHMENT_HANDLER'), 
} as const;