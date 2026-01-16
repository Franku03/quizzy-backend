/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\domain\ports\IUserRepository.ts

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

    findByUsername(username: UserName): Promise<Optional<User>>;

    existsUserByEmail(email: UserEmail): Promise<boolean>;

    existsUserByUsername(username: UserName): Promise<boolean>;

    deleteUser(id: UserId): Promise<void>;

    findAll(): Promise<User[]>;

    // ==========================================
    // MÉTODOS EITHER PARA BACKOFFICE
    // ==========================================

    findUserByIdEither(id: UserId): Promise<Either<ErrorData, User | null>>;

    saveAndGetBackofficeUserEither(
        user: User
    ): Promise<Either<ErrorData, BackOfficeUserReadModel>>;
}