export class UserProfileDetails {
    readonly name: string;
    readonly description: string;
    readonly avatarImageURL: string;

    constructor(name: string, description: string, avatarImageURL: string) {
        this.ensureNameIsValid(name);
        this.ensureDescriptionIsValid(description);
        this.ensureAvatarUrlIsValid(avatarImageURL);

        this.name = name;
        this.description = description;
        this.avatarImageURL = avatarImageURL;
    }

    private ensureNameIsValid(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error("El nombre no puede estar vacío.");
        }
        if (name.length > 148) {
            throw new Error(`El nombre es demasiado largo. Máximo 148 caracteres.`);
        }
    }

    private ensureDescriptionIsValid(description: string): void {
        if (description.length > 300) {
            throw new Error(`La descripción supera el límite de 300 caracteres.`);
        }
    }

    private ensureAvatarUrlIsValid(url: string): void {
        if (url === '') return; 

        try {
            new URL(url);
        } catch (error) {
            throw new Error(`La URL del avatar <${url}> no es válida.`);
        }
    }

    equals(other: UserProfileDetails): boolean {
        return (
            this.name === other.name &&
            this.description === other.description &&
            this.avatarImageURL === other.avatarImageURL
        );
    }
}