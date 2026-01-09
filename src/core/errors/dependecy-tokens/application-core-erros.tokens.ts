//src\core\errors\dependecy-tokens\application-core-erros.tokens.ts
export const ERROR_TOKENS = {
    MAPPERS: {
        MONGO: Symbol('MONGO_ERROR_MAPPER'),
        CLOUDINARY: Symbol('CLOUDINARY_ERROR_MAPPER'),
        POSTGRES: Symbol('POSTGRES_ERROR_MAPPER'),
        PIN: Symbol('PIN_GENERATOR_ERROR_MAPPER'),
    }
};