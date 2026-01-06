// src/core/application/dependecy-tokens/application-core.tokens.ts

export const APPLICATION_CORE_TOKENS = {
    MAPPER: {
        // Lectura desde Persistence (Infra -> Domain)
        KAHOOT_READ: Symbol('KAHOOT_READ_MAPPER'),
        USER_READ: Symbol('USER_READ_MAPPER'),

        // Salida hacia el exterior (Domain/App -> DTO)
        RESPONSE_MAPPER: Symbol('RESPONSE_MAPPER'),

        // Entrada desde el Controlador (DTO -> Command)
        CREATE_KAHOOT_REQUEST: Symbol('CREATE_KAHOOT_REQUEST_MAPPER'),
        UPDATE_KAHOOT_REQUEST: Symbol('UPDATE_KAHOOT_REQUEST_MAPPER'),
    },

    UTILS: {
        ID_GENERATOR: Symbol('ID_GENERATOR'),
        CRYPTO_SERVICE: Symbol('CRYPTO_SERVICE'),
        LOGGER: Symbol('LOGGER_SERVICE'),
    }
};