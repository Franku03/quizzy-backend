/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\common.errors.ts

export enum COMMON_ERRORS {

        SESSION_NOT_FOUND = "Sesión no encontrada: El pin no corresponde a ninguna partida activa",
        SLIDE_NOT_FOUND = "La slide solicitada no existe en el kahoot en juego",
        PREVIOUS_SLIDE_NOT_FOUND = "No se pudo obtener la slide previa en la sesión activa",
        NO_OPTIONS = "La slide solicitada no tiene opciones de respuesta",
        NO_VALID_OPTION = "La slide no tiene opcion correcta",
        USER_NOT_FOUND = "Usuario no encontrado: El id del usuario no corresponde a ningun usuario registrado",
        USER_NOT_AUTHORIZED = "Usuario no autorizado: El usuario no puede conectarse a la sesión como HOST",
        SESSION_NOT_ACCEPTING_CONNECTIONS = "El host ha bloqueado las conexiones de nuevos jugadores a la sesión",
        USER_NOT_IN_SESSION = "La partida ya ha comenzado y el usuario no forma parte de la sesión activa",
        RESOURCE_NOT_FOUND = "El recurso solicitado no pudo ser encontrado",

        // Errores Legacy 
        // CREATE_SESSION_ERRORS
        KAHOOT_NOT_FOUND = "El Kahoot solicitado no existe",
        USER_UNAUTHORIZED= "El usuario autenticado (Host) no tiene permisos para crear una sesión con el Kahoot solicitado.",
        KAHOOT_IS_DRAFT = "El Kahoot solicitado está en modo borrador y no puede ser utilizado para crear una sesión multiplayer.",

        // QR_TOKEN_ERRORS
        QR_NOT_FOUND = "El código QR o token no está asociado a una sesión activa.",

        //HOST_NEXT_PHASE_ERRORS
        SESSION_INVALID_STATE = "La sesion se encuentra en un estado desde el cual no se permite avanzar",

        //HOST_START_GAME_ERRORS
        SESSION_ALREADY_BEGUN = "La sesion ya comenzó, la partida no está en su punto de inicio",
        NO_SLIDES = "El kahoot solicitado no tiene slides",


}
