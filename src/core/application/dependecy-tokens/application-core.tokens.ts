// src/core/application/dependecy-tokens/application-core.tokens.ts

export const APPLICATION_CORE_TOKENS = {
    MAPPER: {
        // --- Persistence Snapshots (Infra -> Domain) ---
        // Estos mapean el documento/entidad al Snapshot de Agregado
        KAHOOT_MONGO_SNAPSHOT: Symbol('KAHOOT_MONGO_SNAPSHOT_MAPPER'),
        KAHOOT_PG_SNAPSHOT: Symbol('KAHOOT_PG_SNAPSHOT_MAPPER'),

        //--AUN NO LOS IMPLEMENTO PERO ES PARA REDUCIR EL CODIGO DEL DAO---
        MEDIA_MONGO_SNAPSHOT: Symbol('MEDIA_MONGO_SNAPSHOT_MAPPER'),
        MEDIA_PG_SNAPSHOT: Symbol('MEDIA_PG_SNAPSHOT_MAPPER'),
        
        USER_MONGO_SNAPSHOT: Symbol('USER_MONGO_SNAPSHOT_MAPPER'),
        USER_PG_SNAPSHOT: Symbol('USER_PG_SNAPSHOT_MAPPER'),

        // --- Application Read Models (Infra -> Read Model DTO) ---
        // MongoDB: Une documentos via agregaciones o múltiples finds
        KAHOOT_USER_DETAIL_MONGO_READ: Symbol('KAHOOT_USER_DETAIL_MONGO_READ_MAPPER'),
        // PostgreSQL: Une tablas via JOINs complejos
        KAHOOT_USER_DETAIL_PG_READ: Symbol('KAHOOT_USER_DETAIL_PG_READ_MAPPER'),
        // --- Output Mappers (Domain/App -> Response DTO) ---
        RESPONSE_MAPPER: Symbol('RESPONSE_MAPPER'),

        // --- Input Mappers (Request DTO -> Command) ---
        CREATE_KAHOOT_REQUEST: Symbol('CREATE_KAHOOT_REQUEST_MAPPER'),
        UPDATE_KAHOOT_REQUEST: Symbol('UPDATE_KAHOOT_REQUEST_MAPPER'),
    },

    UTILS: {
        ID_GENERATOR: Symbol('ID_GENERATOR'),
        CRYPTO_SERVICE: Symbol('CRYPTO_SERVICE'),
        LOGGER: Symbol('LOGGER_SERVICE'),
    }
};