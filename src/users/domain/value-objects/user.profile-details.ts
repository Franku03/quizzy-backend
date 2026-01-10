import { ValueObject } from "src/core/domain/abstractions/value.object";
import { InvalidArgumentError } from "../errors/invalid.argument.error";

interface UserProfileDetailsProps {
    readonly name: string;
    readonly description: string;
    readonly avatarAssetId: string;
}

export class UserProfileDetails extends ValueObject<UserProfileDetailsProps> {

    constructor(name: string, description: string, avatarAssetId: string) {
        UserProfileDetails.ensureNameIsValid(name);
        UserProfileDetails.ensureDescriptionIsValid(description);

        super({ name, description, avatarAssetId });
    }
   
    private static ensureNameIsValid(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new InvalidArgumentError("The name cannot be empty.");
        }
        if (name.length > 148) {
            throw new InvalidArgumentError(`The name is too long. Maximum 148 characters.`);
        }
    }
    
    private static ensureDescriptionIsValid(description: string): void {
        if (description.length > 300) {
            throw new InvalidArgumentError(`The description exceeds the 300 character limit.`);
        }
    }
    
    get name(): string {
        return this.properties.name;
    }

    get description(): string {
        return this.properties.description;
    }

    get avatarAssetId(): string {
        return this.properties.avatarAssetId;
    }
}