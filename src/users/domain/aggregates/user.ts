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
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";
import { IPasswordHasher } from "../domain-services/i.password-hasher.interface";
// import { UserCreatedEvent } from "../domain-events/user-created.event"; // TODO
// import { UserPasswordChangedEvent } from "../domain-events/user-password-changed.event"; // TODO

interface UserProps {
    email: UserEmail;
    username: UserName;
    userProfileDetails: UserProfileDetails;
    passwordHash: HashedPassword;
    userPreferences: UserPreferences;
    type: UserType;
    subscriptionStatus: UserSubscriptionStatus;
    lastUsernameUpdate?: DateISO; 
}

export class User extends AggregateRoot<UserProps, UserId> {

    public constructor(props: UserProps, id: UserId) {
        super(props, id);
    }

    public static create(
        id: UserId,
        email: UserEmail,
        username: UserName,
        userProfileDetails: UserProfileDetails,
        passwordHash: HashedPassword,
        type: UserType,
        subscriptionStatus: UserSubscriptionStatus,
        userPreferences?: UserPreferences,
    ): User {
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

        const user = new User(props, id);

        // user.record(new UserCreatedEvent(id, email, username)); // TODO
        
        return user;
    }

    public changeUserName(newUsername: UserName): void {
        if (this.properties.username.equals(newUsername)) {
            return;
        }

        this.checkInvariants();

        this.properties.username = newUsername;
        this.properties.lastUsernameUpdate = DateISO.generate();
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

        // this.record(new UserPasswordChangedEvent(this.id, this.properties.email)); // TODO
    }

    public async verifyPassword(inputPassword: PlainPassword, hasher: IPasswordHasher): Promise<boolean> {
        return this.properties.passwordHash.match(inputPassword, hasher);
    }
    
    public async resetPassword(newPassword: PlainPassword, hasher: IPasswordHasher): Promise<void> {
        this.properties.passwordHash = await newPassword.hash(hasher);
    }
    
    protected checkInvariants(): void {
        const lastUpdateVO = this.properties.lastUsernameUpdate;
    
        if (!lastUpdateVO) return;

        const lastUpdateDate = new Date(lastUpdateVO.value);
        const nextAllowedDate = new Date(lastUpdateDate);
        nextAllowedDate.setFullYear(nextAllowedDate.getFullYear() + 1);
        
        const nextAllowedIsoString = nextAllowedDate.toISOString().split('T')[0];
        const nextAllowedDateVO = DateISO.createFrom(nextAllowedIsoString);

        const todayVO = DateISO.generate();

        if (nextAllowedDateVO.isGreaterThan(todayVO)) {
            throw new Error(`Solo puedes cambiar tu nombre de usuario una vez al año. Podrás hacerlo nuevamente el: ${nextAllowedDateVO.value}`);
        }
    }

    public isUserPremium(): boolean {
        return this.properties.subscriptionStatus.isPremium();
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

    get lastUsernameUpdate(): DateISO | undefined {
        return this.properties.lastUsernameUpdate;
    }
}