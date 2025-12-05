import { User } from "../aggregates/user";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserEmail } from "../value-objects/user.email";
import { UserName } from "../value-objects/user.user-name";

export interface IUserRepository {

    save(user: User): Promise<void>; 

    findUserById(id: UserId): Promise<User | null>;

    findUserByEmail(email: UserEmail): Promise<User | null>;

    existsUserByEmail(email: UserEmail): Promise<boolean>;

    existsUserByUsername(username: UserName): Promise<boolean>;

    deleteUser(id: UserId): Promise<void>;
}