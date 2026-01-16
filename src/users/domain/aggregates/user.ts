import { AggregateRoot } from 'src/core/domain/abstractions/aggregate.root';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from '../value-objects/user.email';
import { UserName } from '../value-objects/user.user-name';
import { UserProfileDetails } from '../value-objects/user.profile-details';
import { HashedPassword } from '../value-objects/user.hashed-password';
import { UserPreferences } from '../value-objects/user.user-preferences';
import { UserType } from '../value-objects/user.type';
import { UserSubscriptionStatus } from '../value-objects/user.user-subscription-status';
import { PlainPassword } from '../value-objects/user.plain-password';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';
import { IPasswordHasher } from '../domain-services/i.password-hasher.interface';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { UserFavorites } from '../value-objects/user.favorite-kahoots';
import { IDeletedUserHasher } from '../domain-services/deleted-user-hashed.interface';
import { UserState } from '../value-objects/user.state';
import { UserRole } from '../value-objects/user.roles';
import { SubscriptionPlan } from '../value-objects/user.subscription-plan';

interface UserProps {
  email: UserEmail;
  username: UserName;
  userProfileDetails: UserProfileDetails;
  passwordHash: HashedPassword;
  userPreferences: UserPreferences;
  type: UserType;
  subscriptionStatus: UserSubscriptionStatus;
  lastUsernameUpdate?: DateISO;
  favorites: UserFavorites;
  state: UserState; // Reemplaza isBlocked
  roles: UserRole[]; // Reemplaza isAdmin (array de roles)
  isDeleted: boolean;
  deletedHash: string | null;
}

export class User extends AggregateRoot<UserProps, UserId> {
  // Constructor privado (factory method)
  private constructor(props: UserProps, id: UserId) {
    super(props, id);
  }

  // Método estático para crear NUEVOS usuarios (Factory Method)
  public static create(
    id: UserId,
    email: UserEmail,
    username: UserName,
    userProfileDetails: UserProfileDetails,
    passwordHash: HashedPassword,
    type: UserType,
    subscriptionStatus: UserSubscriptionStatus,
    userPreferences?: UserPreferences,
    state: UserState = UserState.ACTIVE,
    roles: UserRole[] = [UserRole.USER],
    isDeleted: boolean = false,
  ): User {
    const finalPreferences = userPreferences || UserPreferences.create('LIGHT');

    const props: UserProps = {
      email,
      username,
      userProfileDetails,
      passwordHash,
      type,
      userPreferences: finalPreferences,
      subscriptionStatus,
      lastUsernameUpdate: undefined,
      favorites: UserFavorites.createEmpty(),
      state,
      roles,
      isDeleted,
      deletedHash: null,
    };

    const user = new User(props, id);

    // user.record(new UserCreatedEvent(id, email, username)); // TODO

    return user;
  }

  // Método estático para reconstruir usuarios existentes desde persistencia
  public static reconstitute(props: UserProps, id: UserId): User {
    return new User(props, id);
  }

  // Métodos para manejar roles
  public addRole(role: UserRole): void {
    if (!this.hasRole(role)) {
      this.properties.roles.push(role);
    }
  }

  public removeRole(role: UserRole): void {
    this.properties.roles = this.properties.roles.filter((r) => r !== role);
  }

  public hasRole(role: UserRole): boolean {
    return this.properties.roles.includes(role);
  }

  public isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  // Métodos para manejar estado (reemplazan ban/unBan)
  public block(): void {
    this.properties.state = UserState.BLOCKED;
  }

  public unblock(): void {
    this.properties.state = UserState.ACTIVE;
  }

  public isActive(): boolean {
    return this.properties.state === UserState.ACTIVE;
  }

  public isBlocked(): boolean {
    return this.properties.state === UserState.BLOCKED;
  }

  // Métodos existentes (sin cambios)
  public addFavorite(kahootId: KahootId): void {
    this.properties.favorites.add(kahootId);
  }

  public removeFavorite(kahootId: KahootId): void {
    this.properties.favorites.remove(kahootId);
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
    hasher: IPasswordHasher,
  ): Promise<void> {
    const isMatch = await this.properties.passwordHash.match(
      currentPassword,
      hasher,
    );

    if (!isMatch) {
      throw new Error('The actual password is incorrect.');
    }

    if (await this.properties.passwordHash.match(newPassword, hasher)) {
      throw new Error('The new password must be different to the actual one.');
    }

    this.properties.passwordHash = await newPassword.hash(hasher);
  }

  public async verifyPassword(
    inputPassword: PlainPassword,
    hasher: IPasswordHasher,
  ): Promise<boolean> {
    return this.properties.passwordHash.match(inputPassword, hasher);
  }

  public async resetPassword(
    newPassword: PlainPassword,
    hasher: IPasswordHasher,
  ): Promise<void> {
    this.properties.passwordHash = await newPassword.hash(hasher);
  }

  public changeSubscription(newPlan: SubscriptionPlan): void {
    this.properties.subscriptionStatus = UserSubscriptionStatus.createForPlan(newPlan);
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
      throw new Error(
        `You can only change your username once a year. Next update available on: ${nextAllowedDateVO.value}`,
      );
    }
  }

  public isUserPremium(): boolean {
    const validatedStatus = this.properties.subscriptionStatus.validateStatus();

    if (!this.properties.subscriptionStatus.equals(validatedStatus)) {
        this.properties.subscriptionStatus = validatedStatus;
    }

    return this.properties.subscriptionStatus.isPremium();
  }

  // Método para eliminar el usuario con hash de auditoría (actualizado)
  public async delete(deletedUserHasher: IDeletedUserHasher): Promise<void> {
    if (this.properties.isDeleted) {
      throw new Error('El usuario ya está eliminado.');
    }

    // 1. Marcar como eliminado
    this.properties.isDeleted = true;

    // 2. Crear un objeto con todos los datos del usuario para hashear
    const userDataForHash = {
      id: this.id.value,
      email: this.properties.email.value,
      username: this.properties.username.value,
      profile: {
        name: this.properties.userProfileDetails.name,
        description: this.properties.userProfileDetails.description,
        avatarAssetId: this.properties.userProfileDetails.avatarAssetId,
      },
      type: this.properties.type,
      subscription: {
        state: this.properties.subscriptionStatus.state,
        plan: this.properties.subscriptionStatus.plan,
        expiresAt: this.properties.subscriptionStatus.expiresAt.value,
      },
      preferences: {
        theme: this.properties.userPreferences.themePreference,
      },
      favorites: this.properties.favorites.toPrimitives(),
      state: this.properties.state, // Cambiado de isBlocked
      roles: this.properties.roles, // Cambiado de isAdmin
      deletedAt: new Date().toISOString(),
    };

    // 3. Convertir a string JSON (ordenado para consistencia)
    const userDataString = JSON.stringify(
      userDataForHash,
      Object.keys(userDataForHash).sort(),
    );

    // 4. Generar hash del usuario eliminado
    this.properties.deletedHash = await deletedUserHasher.hash(userDataString);
  }

  // Método para verificar si el hash de eliminación es válido (actualizado)
  public async verifyDeletedHash(
    deletedUserHasher: IDeletedUserHasher,
  ): Promise<boolean> {
    if (!this.properties.isDeleted || !this.properties.deletedHash) {
      return false;
    }

    // Reconstruir el objeto de datos del usuario
    const userDataForHash = {
      id: this.id.value,
      email: this.properties.email.value,
      username: this.properties.username.value,
      profile: {
        name: this.properties.userProfileDetails.name,
        description: this.properties.userProfileDetails.description,
        avatarAssetId: this.properties.userProfileDetails.avatarAssetId,
      },
      type: this.properties.type,
      subscription: {
        state: this.properties.subscriptionStatus.state,
        plan: this.properties.subscriptionStatus.plan,
        expiresAt: this.properties.subscriptionStatus.expiresAt.value,
      },
      preferences: {
        theme: this.properties.userPreferences.themePreference,
      },
      favorites: this.properties.favorites.toPrimitives(),
      state: this.properties.state, // Cambiado de isBlocked
      roles: this.properties.roles, // Cambiado de isAdmin
      deletedAt: new Date().toISOString(),
    };

    const userDataString = JSON.stringify(
      userDataForHash,
      Object.keys(userDataForHash).sort(),
    );

    // Comparar con el hash almacenado
    return await deletedUserHasher.compare(
      userDataString,
      this.properties.deletedHash,
    );
  }

  // Getters
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

  get favorites(): UserFavorites {
    return this.properties.favorites;
  }

  get state(): UserState {
    return this.properties.state;
  }

  get roles(): UserRole[] {
    return [...this.properties.roles]; // Devuelve copia para evitar mutaciones externas
  }

  get isDeleted(): boolean {
    return this.properties.isDeleted;
  }

  get deletedHash(): string | null {
    return this.properties.deletedHash;
  }
}
