import { User } from "../aggregates/user";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserEmail } from "../value-objects/user.email";
import { UserName } from "../value-objects/user.user-name";
import { Optional } from "src/core/types/optional";
import { Either, ErrorData } from "src/core/types";
import { BackOfficeUserReadModel } from "src/backoffice/application/read-model/backoffice-user.read.model";

export interface IUserRepository {

    save(user: User): Promise<void>; 

    findById(id: UserId): Promise<Optional<User>>;

    findByEmail(email: UserEmail): Promise<Optional<User>>;

    existsUserByEmail(email: UserEmail): Promise<boolean>;

    existsUserByUsername(username: UserName): Promise<boolean>;

    deleteUser(id: UserId): Promise<void>;

    // ==========================================
    // MÉTODOS EITHER PARA BACKOFFICE
    // ==========================================

    findUserByIdEither(id: UserId): Promise<Either<ErrorData, User | null>>;

    saveAndGetBackofficeUserEither(
        user: User
    ): Promise<Either<ErrorData, BackOfficeUserReadModel>>;
}