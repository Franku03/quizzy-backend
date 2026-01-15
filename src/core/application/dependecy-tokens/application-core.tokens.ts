/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\dependecy-tokens\application-core.tokens.ts

export const APPLICATION_CORE_TOKENS = {
    MAPPER: {
        // --- Persistence Snapshots (Infra -> Domain) ---
        // Estos mapean el documento/entidad al Snapshot de Agregado
        KAHOOT_MONGO_SNAPSHOT: Symbol('KAHOOT_MONGO_SNAPSHOT_MAPPER'),
        KAHOOT_PG_SNAPSHOT: Symbol('KAHOOT_PG_SNAPSHOT_MAPPER'),

        //--AUN NO LOS IMPLEMENTO PERO ES PARA REDUCIR EL CODIGO DEL DAO NO TIENE DOMAIN---
        MEDIA_MONGO_SNAPSHOT: Symbol('MEDIA_MONGO_SNAPSHOT_MAPPER'),
        MEDIA_PG_SNAPSHOT: Symbol('MEDIA_PG_SNAPSHOT_MAPPER'),

        // --- Persistence Mappers (Domain -> Infra) ---
        // Este es el que necesitas para el flujo de guardado/aplanado
        KAHOOT_PG_PERSISTENCE: Symbol('KAHOOT_PG_PERSISTENCE_MAPPER'), 
        KAHOOT_MONGO_PERSISTENCE: Symbol('KAHOOT_MONGO_PERSISTENCE_MAPPER'),
        
        USER_MONGO_SNAPSHOT: Symbol('USER_MONGO_SNAPSHOT_MAPPER'),
        USER_PG_SNAPSHOT: Symbol('USER_PG_SNAPSHOT_MAPPER'),

        // --- Application Read Models (Infra -> Read Model DTO) ---
        // MongoDB: Une documentos via agregaciones o múltiples finds
        KAHOOT_USER_DETAIL_MONGO_READ: Symbol('KAHOOT_USER_DETAIL_MONGO_READ_MAPPER'),
        SESSION_REPORT_DETAILS_MONGO_READ: Symbol('SESSION_REPORT_DETAILS_MONGO_READ_MAPPER'),
        // PostgreSQL: Une tablas via JOINs complejos
        KAHOOT_USER_DETAIL_PG_READ: Symbol('KAHOOT_USER_DETAIL_PG_READ_MAPPER'),
        SESSION_REPORT_DETAILS_PG_READ: Symbol('SESSION_REPORT_DETAILS_PG_READ_MAPPER'),
        // --- Output Mappers (Domain/App -> Response DTO) ---
        RESPONSE_MAPPER: Symbol('RESPONSE_MAPPER'),

        // --- Input Mappers (Request DTO -> Command) ---
        CREATE_KAHOOT_REQUEST: Symbol('CREATE_KAHOOT_REQUEST_MAPPER'),
        UPDATE_KAHOOT_REQUEST: Symbol('UPDATE_KAHOOT_REQUEST_MAPPER'),
    },

    UTILS: {
        ID_GENERATOR: Symbol('ID_GENERATOR'),
        CRYPTO_SERVICE: Symbol('CRYPTO_SERVICE'),
        PIN_GENERATOR_SERVICE: Symbol('PIN_GENERATOR_SERVICE'),
        PIN_REPO: Symbol('PIN_REPO'),
        ACTIVE_SESSION_REPO: Symbol('ACTIVE_SESSION_REPO'),
        CONCURRENCY_MANAGER: Symbol('CONCURRENCY_MANAGER'),
        LOGGER: Symbol('LOGGER_SERVICE'),
    }
};
