import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserEmail } from "../value-objects/user.email";
import { UserName } from "../value-objects/user.user-name";
import { UserProfileDetails } from "../value-objects/user.profile-details";
import { HashedPassword } from "../value-objects/user.hashed-password";
import { UserPreferences } from "../value-objects/user.user-preferences";
import { UserType } from "../value-objects/user.type";
import { UserSubscriptionStatus } from "../value-objects/user.user-subscription-status";
import { PlainPassword } from "../value-objects/user.plain-password";
import { IPasswordHasher } from "../domain-services/i.password-hasher.interface";
import { IUuidGenerationService } from "src/users/domain/domain-services/i.uuid-generator.interface";

interface UserProps {
    email: UserEmail;
    username: UserName;
    userProfileDetails: UserProfileDetails;
    passwordHash: HashedPassword;
    userPreferences: UserPreferences;
    type: UserType;
    subscriptionStatus: UserSubscriptionStatus;
    lastUsernameUpdate?: Date; 
}

export class User extends AggregateRoot<UserProps, UserId> {

    private constructor(props: UserProps, id: UserId) {
        super(props, id);
    }

    public static create(
        uuidService: IUuidGenerationService,
        email: UserEmail,
        username: UserName,
        userProfileDetails: UserProfileDetails,
        passwordHash: HashedPassword,
        type: UserType,
        subscriptionStatus: UserSubscriptionStatus,
        userPreferences?: UserPreferences,
    ): User {
        const uuidString = uuidService.generateIUserId();
        const userId = new UserId(uuidString);

        const finalPreferences = userPreferences || UserPreferences.create("LIGHT");

        const props: UserProps = {
            email,
            username,
            userProfileDetails,
            passwordHash,
            type,
            userPreferences: finalPreferences,
            subscriptionStatus,
            lastUsernameUpdate: undefined, 
        };

        return new User(props, userId);
    }

    public changeUserName(newUsername: UserName): void {
        if (this.properties.username.equals(newUsername)) {
            return;
        }

        this.ensureUsernameChangeIsAllowed();

        this.properties.username = newUsername;
        this.properties.lastUsernameUpdate = new Date();
    }

    public changeEmail(newEmail: UserEmail): void {
        if (this.properties.email.equals(newEmail)) {
            return;
        }
        this.properties.email = newEmail;
    }

    public changeProfileDetails(newDetails: UserProfileDetails): void {
        if (this.properties.userProfileDetails.equals(newDetails)) {
            return;
        }
        this.properties.userProfileDetails = newDetails;
    }

    public changeUserPreferences(newUserPreferences: UserPreferences): void {
        if (this.properties.userPreferences.equals(newUserPreferences)) {
            return;
        }
        this.properties.userPreferences = newUserPreferences;
    }

    public async changePassword(
        currentPassword: PlainPassword, 
        newPassword: PlainPassword, 
        hasher: IPasswordHasher
    ): Promise<void> {
        const isMatch = await this.properties.passwordHash.match(currentPassword, hasher);
        
        if (!isMatch) {
            throw new Error("La contraseña actual es incorrecta.");
        }

        if (await this.properties.passwordHash.match(newPassword, hasher)) {
             throw new Error("La nueva contraseña debe ser diferente a la actual.");
        }

        this.properties.passwordHash = await newPassword.hash(hasher);
    }

    public async verifyPassword(inputPassword: PlainPassword, hasher: IPasswordHasher): Promise<boolean> {
        return this.properties.passwordHash.match(inputPassword, hasher);
    }
    
    public async resetPassword(newPassword: PlainPassword, hasher: IPasswordHasher): Promise<void> {
        this.properties.passwordHash = await newPassword.hash(hasher);
    }

    private ensureUsernameChangeIsAllowed(): void {
        const lastUpdate = this.properties.lastUsernameUpdate;

        if (!lastUpdate) return;

        const now = new Date();
        const nextAllowedDate = new Date(lastUpdate);
        nextAllowedDate.setFullYear(nextAllowedDate.getFullYear() + 1);

        if (now < nextAllowedDate) {
            throw new Error(`Solo puedes cambiar tu nombre de usuario una vez al año.`);
        }
    }

    protected checkInvariants(): void {
    }

    get email(): UserEmail {
        return this.properties.email;
    }

    get username(): UserName {
        return this.properties.username;
    }

    get userProfileDetails(): UserProfileDetails {
        return this.properties.userProfileDetails;
    }

    get passwordHash(): HashedPassword {
        return this.properties.passwordHash;
    }

    get userPreferences(): UserPreferences {
        return this.properties.userPreferences;
    }

    get type(): UserType {
        return this.properties.type;
    }

    get subscriptionStatus(): UserSubscriptionStatus {
        return this.properties.subscriptionStatus;
    }

    public isUserPremium(): boolean {
        return this.properties.subscriptionStatus.isPremium();
    }
}