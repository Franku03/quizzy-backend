import { ValueObject } from "src/core/domain/abstractions/value.object";

interface UserProfileDetailsProps {
    readonly name: string;
    readonly description: string;
    readonly avatarImageURL: string;
}

export class UserProfileDetails extends ValueObject<UserProfileDetailsProps> {

    constructor(name: string, description: string, avatarImageURL: string) {
        UserProfileDetails.ensureNameIsValid(name);
        UserProfileDetails.ensureDescriptionIsValid(description);
        UserProfileDetails.ensureAvatarUrlIsValid(avatarImageURL);

        super({ name, description, avatarImageURL });
    }
   
    private static ensureNameIsValid(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error("El nombre no puede estar vacío.");
        }
        if (name.length > 148) {
            throw new Error(`El nombre es demasiado largo. Máximo 148 caracteres.`);
        }
    }
    
    private static ensureDescriptionIsValid(description: string): void {
        if (description.length > 300) {
            throw new Error(`La descripción supera el límite de 300 caracteres.`);
        }
    }

    private static ensureAvatarUrlIsValid(url: string): void {
        if (url === '') return;

        try {
            new URL(url);
        } catch (error) {
            throw new Error(`La URL del avatar <${url}> no es válida.`);
        }
    }
    
    get name(): string {
        return this.properties.name;
    }

    get description(): string {
        return this.properties.description;
    }

    get avatarImageURL(): string {
        return this.properties.avatarImageURL;
    }
}