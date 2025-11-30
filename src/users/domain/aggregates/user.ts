import { Optional } from "src/core/types/optional";
import { Either } from "src/core/types/either";
import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserEmail } from "../value-objects/user.email";
import { UserName } from "../value-objects/user.user-name";
import { UserProfileDetails } from "../value-objects/user.profile-details";


interface UserProps {

    email: UserEmail;
    username: UserName;
    userProfileDetails: UserProfileDetails;
}


export class User extends AggregateRoot<UserProps, UserId> {

    public constructor(props: UserProps, id: UserId) {
        super(props, id);
    }

    /* =====================================================================================
                Comportamientos del Usuario
    =====================================================================================*/

    // Aquí irían los métodos específicos del usuario, como actualizar perfil, cambiar contraseña, etc.
    protected checkInvariants(): void {
        
    }
}