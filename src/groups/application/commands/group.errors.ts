export enum GROUP_ERRORS {
    NOT_FOUND = "El grupo no existe",
    INVALID_DETAILS = "Los detalles del grupo no son válidos",
    NOT_ADMIN = "El usuario no es el admin del grupo",
    NOT_MEMBER = "El usuario no es miembro del grupo",
    ALREADY_MEMBER = "El usuario ya es miembro del grupo",
    ALREADY_ADMIN = "El usuario ya es admin del grupo",
    NOT_ENOUGH_MEMBERS = "El grupo no puede tener más de 5 miembros si el admin no es premium",
    INVALID_INVITATION_TOKEN = "La invitación no es válida",
    NOT_ENOUGH_PREMIUM = "El admin no es premium",
    ADMIN_REQUIRED = "El adminId es requerido para crear un grupo",
    USER_NOT_FOUND = "El usuario no existe"
}
