import { User } from "../aggregates/user";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserEmail } from "../value-objects/user.email";
import { UserName } from "../value-objects/user.user-name";

export interface UserRepository {

    save(user: User): Promise<void>;

    findById(id: UserId): Promise<User | null>;

    findByEmail(email: UserEmail): Promise<User | null>;

    existsByEmail(email: UserEmail): Promise<boolean>;

    existsByUsername(username: UserName): Promise<boolean>;

    delete(id: UserId): Promise<void>;
}