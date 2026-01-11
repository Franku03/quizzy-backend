/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\helpers\validate-nickname-invariants.ts

import { MAX_NICKNAME_TEXT_LENGTH, MIN_NICKNAME_TEXT_LENGTH } from "../constants/player-constants";

interface Validation {
    isValid: boolean,
    cleanNickname: string 
    errorMessage?: string,
}

export const validateNicknameInvariants = (nickname: string): Validation  => {

        const cleanNickname = nickname ? nickname.trim() : "";

        if( cleanNickname.length === 0 )
            return { isValid: false, cleanNickname, errorMessage: "El nickname del usuario no puede estar vacío" }
        
        if( cleanNickname.length > MAX_NICKNAME_TEXT_LENGTH )
            return { isValid: false, cleanNickname, errorMessage: `La longitud del nickname NO puede superar los ${ MAX_NICKNAME_TEXT_LENGTH } caracteres.`}

        if( cleanNickname.length < MIN_NICKNAME_TEXT_LENGTH )
            return { isValid: false, cleanNickname, errorMessage: `La longitud del nickname DEBE ser superior a los ${ MIN_NICKNAME_TEXT_LENGTH } caracteres.`}

        return { isValid: true, cleanNickname, errorMessage: undefined };

}